using Erp.BuildingBlocks.SharedKernel;
using Microsoft.EntityFrameworkCore;
using ProductionPlanningService.Domain;

namespace ProductionPlanningService.Infrastructure.Persistence;

public sealed class PlanningDbContext(DbContextOptions<PlanningDbContext> options) : DbContext(options)
{
    public DbSet<LineCapacityPlan> LineCapacityPlans => Set<LineCapacityPlan>();
    public DbSet<PlanningBalance> PlanningBalances => Set<PlanningBalance>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Domain.AuditableEntity>().Where(x => x.State is EntityState.Added or EntityState.Modified))
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = BusinessTime.Now;
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = BusinessTime.Now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LineCapacityPlan>(e =>
        {
            e.ToTable("LineCapacityPlans");
            e.Property(x => x.LineCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.LineName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50);
            e.HasIndex(x => new { x.CompanyId, x.OrderId, x.LineCode, x.PlanDate });
        });
        modelBuilder.Entity<PlanningBalance>(e =>
        {
            e.ToTable("PlanningBalances");
            e.HasIndex(x => new { x.CompanyId, x.OrderId, x.LineCapacityPlanId });
        });
    }
}
