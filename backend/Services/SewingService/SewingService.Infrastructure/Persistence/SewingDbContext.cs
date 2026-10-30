using Erp.BuildingBlocks.SharedKernel;
using Microsoft.EntityFrameworkCore;
using SewingService.Application;
using SewingService.Domain;

namespace SewingService.Infrastructure.Persistence;

public sealed class SewingDbContext(DbContextOptions<SewingDbContext> options) : DbContext(options), ISewingDbContext
{
    public DbSet<SewingLine> SewingLines => Set<SewingLine>();
    public DbSet<ProductionAssignment> ProductionAssignments => Set<ProductionAssignment>();
    public DbSet<ProductionTarget> ProductionTargets => Set<ProductionTarget>();
    public DbSet<DailyProductionRecord> DailyProductionRecords => Set<DailyProductionRecord>();
    public DbSet<SewingOutput> SewingOutputs => Set<SewingOutput>();
    public DbSet<PanelTransferReceipt> PanelTransferReceipts => Set<PanelTransferReceipt>();
    public DbSet<SewingBalance> SewingBalances => Set<SewingBalance>();

    IQueryable<SewingLine> ISewingDbContext.SewingLines => SewingLines;
    IQueryable<ProductionAssignment> ISewingDbContext.ProductionAssignments => ProductionAssignments;
    IQueryable<ProductionTarget> ISewingDbContext.ProductionTargets => ProductionTargets;
    IQueryable<DailyProductionRecord> ISewingDbContext.DailyProductionRecords => DailyProductionRecords;
    IQueryable<SewingOutput> ISewingDbContext.SewingOutputs => SewingOutputs;
    IQueryable<PanelTransferReceipt> ISewingDbContext.PanelTransferReceipts => PanelTransferReceipts;
    IQueryable<SewingBalance> ISewingDbContext.SewingBalances => SewingBalances;

    void ISewingDbContext.Add<TEntity>(TEntity entity) => Set<TEntity>().Add(entity);
    void ISewingDbContext.Remove<TEntity>(TEntity entity) => Set<TEntity>().Remove(entity);

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
        base.OnModelCreating(modelBuilder);
        ConfigureAuditable<SewingLine>(modelBuilder);
        ConfigureAuditable<ProductionAssignment>(modelBuilder);
        ConfigureAuditable<ProductionTarget>(modelBuilder);
        ConfigureAuditable<DailyProductionRecord>(modelBuilder);
        ConfigureAuditable<SewingOutput>(modelBuilder);
        ConfigureAuditable<PanelTransferReceipt>(modelBuilder);
        ConfigureAuditable<SewingBalance>(modelBuilder);

        modelBuilder.Entity<SewingLine>(e =>
        {
            e.ToTable("SewingLines");
            e.Property(x => x.LineName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50);
            e.HasIndex(x => new { x.CompanyId, x.LineName }).IsUnique();
        });

        modelBuilder.Entity<ProductionAssignment>(e =>
        {
            e.ToTable("ProductionAssignments");
            e.Property(x => x.StyleNo).HasMaxLength(100);
            e.Property(x => x.BuyerName).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(50);
            e.HasIndex(x => new { x.CompanyId, x.OrderId, x.SewingLineId, x.AssignDate });
            e.HasOne(x => x.SewingLine).WithMany().HasForeignKey(x => x.SewingLineId);
        });

        modelBuilder.Entity<ProductionTarget>(e =>
        {
            e.ToTable("ProductionTargets");
            e.HasIndex(x => new { x.AssignmentId, x.TargetDate }).IsUnique();
            e.HasOne(x => x.Assignment).WithMany(x => x.Targets).HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DailyProductionRecord>(e =>
        {
            e.ToTable("DailyProductionRecords");
            e.HasIndex(x => new { x.AssignmentId, x.RecordDate }).IsUnique();
            e.HasOne(x => x.Assignment).WithMany(x => x.DailyRecords).HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SewingOutput>(e =>
        {
            e.ToTable("SewingOutputs");
            e.Property(x => x.OutputNo).HasMaxLength(50).IsRequired();
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.OrderId, x.OutputDate });
        });

        modelBuilder.Entity<PanelTransferReceipt>(e =>
        {
            e.ToTable("PanelTransferReceipts");
            e.Property(x => x.ReceiptNo).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.CuttingTransferId).IsUnique();
        });

        modelBuilder.Entity<SewingBalance>(e =>
        {
            e.ToTable("SewingBalances");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.OrderId, x.ColorName, x.SizeName }).IsUnique();
        });
    }

    private static void ConfigureAuditable<T>(ModelBuilder modelBuilder) where T : Domain.AuditableEntity =>
        modelBuilder.Entity<T>(e => e.Property(x => x.RowVersion).IsRowVersion());
}
