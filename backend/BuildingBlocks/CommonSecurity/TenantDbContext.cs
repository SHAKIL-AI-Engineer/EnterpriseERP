using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace Erp.BuildingBlocks.CommonSecurity;

/// <summary>Company isolation for both ID lookups and changes, including owned child records.</summary>
public abstract class TenantDbContext(DbContextOptions options, ITenantContext? tenant) : DbContext(options)
{
    // No request context is used by migrations, startup seeders and explicit background jobs.
    public bool BypassCompanyFilter => tenant is null || !tenant.IsAuthenticated || tenant.IsSuperAdmin;
    public Guid ScopedCompanyId => tenant?.ActiveCompanyId ?? Guid.Empty;

    protected void ApplyCompanyFilters(ModelBuilder model)
    {
        foreach (var entity in model.Model.GetEntityTypes().Where(e => e.BaseType is null))
        {
            var parameter = Expression.Parameter(entity.ClrType, "row");
            Expression? company = null;
            if (entity.FindProperty("CompanyId")?.ClrType == typeof(Guid))
                company = Expression.Property(parameter, "CompanyId");
            else
            {
                var owner = entity.GetNavigations().FirstOrDefault(n => !n.IsCollection
                    && n.TargetEntityType.FindProperty("CompanyId")?.ClrType == typeof(Guid));
                if (owner is not null) company = Expression.Property(Expression.Property(parameter, owner.Name), "CompanyId");
            }
            if (company is null) continue;
            var context = Expression.Constant(this);
            var scope = Expression.OrElse(Expression.Property(context, nameof(BypassCompanyFilter)),
                Expression.Equal(company, Expression.Property(context, nameof(ScopedCompanyId))));
            var existing = entity.GetQueryFilter();
            if (existing is not null)
                scope = Expression.AndAlso(scope, new ReplaceParameter(existing.Parameters[0], parameter).Visit(existing.Body)!);
            entity.SetQueryFilter(Expression.Lambda(scope, parameter));
        }
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ValidateCompanyChangesAsync(CancellationToken.None).GetAwaiter().GetResult();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        await ValidateCompanyChangesAsync(cancellationToken);
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private async Task ValidateCompanyChangesAsync(CancellationToken ct)
    {
        if (BypassCompanyFilter) return;
        if (ScopedCompanyId == Guid.Empty) throw new UnauthorizedAccessException("Company context is required.");
        foreach (var entry in ChangeTracker.Entries().Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted).ToList())
        {
            if (entry.Metadata.FindProperty("CompanyId")?.ClrType == typeof(Guid))
            {
                var company = entry.Property("CompanyId");
                if (!Equals(company.CurrentValue, ScopedCompanyId)
                    || (entry.State != EntityState.Added && !Equals(company.OriginalValue, ScopedCompanyId)))
                    throw new UnauthorizedAccessException("The record belongs to another company.");
            }
            foreach (var fk in entry.Metadata.GetForeignKeys().Where(f => f.Properties.Count == 1
                && f.PrincipalKey.Properties.Count == 1 && f.PrincipalKey.Properties[0].Name == "Id"
                && f.PrincipalEntityType.FindProperty("CompanyId")?.ClrType == typeof(Guid)))
            {
                if (entry.Property(fk.Properties[0].Name).CurrentValue is not Guid id || id == Guid.Empty) continue;
                var local = ChangeTracker.Entries().FirstOrDefault(e => e.Metadata == fk.PrincipalEntityType
                    && Equals(e.Property("Id").CurrentValue, id));
                if (local is not null && Equals(local.Property("CompanyId").CurrentValue, ScopedCompanyId)) continue;
                var method = typeof(TenantDbContext).GetMethod(nameof(OwnerExistsAsync), BindingFlags.Instance | BindingFlags.NonPublic)!;
                var exists = await (Task<bool>)method.MakeGenericMethod(fk.PrincipalEntityType.ClrType).Invoke(this, [id, ct])!;
                if (!exists) throw new UnauthorizedAccessException("Related record is unavailable in the active company.");
            }
        }
    }

    private Task<bool> OwnerExistsAsync<T>(Guid id, CancellationToken ct) where T : class =>
        Set<T>().AsNoTracking().AnyAsync(x => EF.Property<Guid>(x, "Id") == id, ct);

    private sealed class ReplaceParameter(ParameterExpression from, ParameterExpression to) : ExpressionVisitor
    {
        protected override Expression VisitParameter(ParameterExpression node) => node == from ? to : base.VisitParameter(node);
    }
}
