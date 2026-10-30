using Erp.BuildingBlocks.SharedKernel;
using Microsoft.EntityFrameworkCore;
using ShipmentService.Domain;

namespace ShipmentService.Infrastructure.Persistence;

public sealed class ShipmentDbContext(DbContextOptions<ShipmentDbContext> options) : DbContext(options)
{
    public DbSet<ShipmentReadiness> ShipmentReadiness => Set<ShipmentReadiness>();
    public DbSet<ShipmentExecution> ShipmentExecutions => Set<ShipmentExecution>();

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
        modelBuilder.Entity<ShipmentReadiness>(e => { e.ToTable("ShipmentReadiness"); e.HasIndex(x => new { x.CompanyId, x.OrderId }); });
        modelBuilder.Entity<ShipmentExecution>(e => { e.ToTable("ShipmentExecutions"); e.HasIndex(x => new { x.CompanyId, x.OrderId }); });
    }
}
