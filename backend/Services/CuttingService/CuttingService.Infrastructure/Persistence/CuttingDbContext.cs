using CuttingService.Application;
using CuttingService.Domain;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace CuttingService.Infrastructure.Persistence;

public sealed class CuttingDbContext(DbContextOptions<CuttingDbContext> options) : DbContext(options), ICuttingDbContext
{
    public DbSet<CuttingPlan> CuttingPlans => Set<CuttingPlan>();
    public DbSet<CuttingPlanSizeBreakdown> CuttingPlanSizeBreakdowns => Set<CuttingPlanSizeBreakdown>();
    public DbSet<FabricIssueToCutting> FabricIssuesToCutting => Set<FabricIssueToCutting>();
    public DbSet<CuttingLay> CuttingLays => Set<CuttingLay>();
    public DbSet<CuttingLaySizeDetail> CuttingLaySizeDetails => Set<CuttingLaySizeDetail>();
    public DbSet<CuttingOutput> CuttingOutputs => Set<CuttingOutput>();
    public DbSet<CuttingWastage> CuttingWastages => Set<CuttingWastage>();
    public DbSet<CuttingBalance> CuttingBalances => Set<CuttingBalance>();
    public DbSet<CuttingPanelTransfer> CuttingPanelTransfers => Set<CuttingPanelTransfer>();
    public DbSet<CuttingPanelTransferItem> CuttingPanelTransferItems => Set<CuttingPanelTransferItem>();
    public DbSet<CuttingAuditLog> AuditLogs => Set<CuttingAuditLog>();
    public DbSet<CuttingBundle> CuttingBundles => Set<CuttingBundle>();

    IQueryable<CuttingPlan> ICuttingDbContext.CuttingPlans => CuttingPlans;
    IQueryable<CuttingPlanSizeBreakdown> ICuttingDbContext.CuttingPlanSizeBreakdowns => CuttingPlanSizeBreakdowns;
    IQueryable<FabricIssueToCutting> ICuttingDbContext.FabricIssuesToCutting => FabricIssuesToCutting;
    IQueryable<CuttingLay> ICuttingDbContext.CuttingLays => CuttingLays;
    IQueryable<CuttingLaySizeDetail> ICuttingDbContext.CuttingLaySizeDetails => CuttingLaySizeDetails;
    IQueryable<CuttingOutput> ICuttingDbContext.CuttingOutputs => CuttingOutputs;
    IQueryable<CuttingWastage> ICuttingDbContext.CuttingWastages => CuttingWastages;
    IQueryable<CuttingBalance> ICuttingDbContext.CuttingBalances => CuttingBalances;
    IQueryable<CuttingPanelTransfer> ICuttingDbContext.CuttingPanelTransfers => CuttingPanelTransfers;
    IQueryable<CuttingPanelTransferItem> ICuttingDbContext.CuttingPanelTransferItems => CuttingPanelTransferItems;
    IQueryable<CuttingAuditLog> ICuttingDbContext.AuditLogs => AuditLogs;
    IQueryable<CuttingBundle> ICuttingDbContext.CuttingBundles => CuttingBundles;

    void ICuttingDbContext.Add<TEntity>(TEntity entity) => Set<TEntity>().Add(entity);
    void ICuttingDbContext.Remove<TEntity>(TEntity entity) => Set<TEntity>().Remove(entity);

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<CuttingService.Domain.AuditableEntity>().Where(x => x.State is EntityState.Added or EntityState.Modified))
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = BusinessTime.Now;
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = BusinessTime.Now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ConfigureAuditable<CuttingPlan>(modelBuilder);
        ConfigureAuditable<CuttingPlanSizeBreakdown>(modelBuilder);
        ConfigureAuditable<FabricIssueToCutting>(modelBuilder);
        ConfigureAuditable<CuttingLay>(modelBuilder);
        ConfigureAuditable<CuttingLaySizeDetail>(modelBuilder);
        ConfigureAuditable<CuttingOutput>(modelBuilder);
        ConfigureAuditable<CuttingWastage>(modelBuilder);
        ConfigureAuditable<CuttingPanelTransfer>(modelBuilder);
        ConfigureAuditable<CuttingPanelTransferItem>(modelBuilder);
        ConfigureAuditable<CuttingBundle>(modelBuilder);

        modelBuilder.Entity<CuttingPlan>(e =>
        {
            e.ToTable("CuttingPlans");
            e.Property(x => x.PlanNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(CuttingPlanStatuses.Draft);
            e.HasIndex(x => new { x.CompanyId, x.PlanNo }).IsUnique();
        });
        modelBuilder.Entity<CuttingPlanSizeBreakdown>(e =>
        {
            e.ToTable("CuttingPlanSizeBreakdowns");
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.CuttingPlan).WithMany(x => x.SizeBreakdowns).HasForeignKey(x => x.CuttingPlanId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<FabricIssueToCutting>(e =>
        {
            e.ToTable("FabricIssuesToCutting");
            e.Property(x => x.IssueNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.IssueQty).HasPrecision(18, 4);
            e.Property(x => x.UnitName).HasMaxLength(50).IsRequired();
            e.Property(x => x.LotNo).HasMaxLength(100);
            e.Property(x => x.BatchNo).HasMaxLength(100);
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(FabricIssueStatuses.Received);
            e.HasIndex(x => new { x.CompanyId, x.IssueNo }).IsUnique();
            e.HasOne(x => x.CuttingPlan).WithMany(x => x.FabricIssues).HasForeignKey(x => x.CuttingPlanId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<CuttingLay>(e =>
        {
            e.ToTable("CuttingLays");
            e.Property(x => x.LayNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.MarkerNo).HasMaxLength(100);
            e.Property(x => x.FabricLength).HasPrecision(18, 4);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(CuttingLayStatuses.Open);
            e.HasIndex(x => new { x.CompanyId, x.CuttingPlanId, x.LayNo }).IsUnique();
            e.HasOne(x => x.CuttingPlan).WithMany(x => x.Lays).HasForeignKey(x => x.CuttingPlanId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<CuttingLaySizeDetail>(e =>
        {
            e.ToTable("CuttingLaySizeDetails");
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.CuttingLay).WithMany(x => x.SizeDetails).HasForeignKey(x => x.CuttingLayId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<CuttingOutput>(e =>
        {
            e.ToTable("CuttingOutputs");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(CuttingOutputStatuses.Created);
            e.HasIndex(x => new { x.CompanyId, x.OrderId, x.CuttingPlanId });
            e.HasOne(x => x.CuttingPlan).WithMany(x => x.Outputs).HasForeignKey(x => x.CuttingPlanId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.CuttingLay).WithMany().HasForeignKey(x => x.CuttingLayId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<CuttingWastage>(e =>
        {
            e.ToTable("CuttingWastages");
            e.Property(x => x.WastageQty).HasPrecision(18, 4);
            e.Property(x => x.WastageReason).HasMaxLength(300).IsRequired();
        });
        modelBuilder.Entity<CuttingBalance>(e =>
        {
            e.ToTable("CuttingBalances");
            e.HasKey(x => x.Id);
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.OrderId, x.ColorName, x.SizeName }).IsUnique();
        });
        modelBuilder.Entity<CuttingPanelTransfer>(e =>
        {
            e.ToTable("CuttingPanelTransfers");
            e.Property(x => x.TransferNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.ToDepartment).HasMaxLength(100).HasDefaultValue("Production");
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(PanelTransferStatuses.Draft);
            e.HasIndex(x => new { x.CompanyId, x.TransferNo }).IsUnique();
        });
        modelBuilder.Entity<CuttingPanelTransferItem>(e =>
        {
            e.ToTable("CuttingPanelTransferItems");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.CuttingPanelTransfer).WithMany(x => x.Items).HasForeignKey(x => x.CuttingPanelTransferId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<CuttingAuditLog>(e =>
        {
            e.ToTable("CuttingAuditLogs");
            e.HasKey(x => x.Id);
            e.Property(x => x.EntityName).HasMaxLength(120).IsRequired();
            e.Property(x => x.Action).HasMaxLength(50).IsRequired();
            e.Property(x => x.Remarks).HasMaxLength(500);
        });
        modelBuilder.Entity<CuttingBundle>(e =>
        {
            e.ToTable("CuttingBundles");
            e.Property(x => x.BundleTag).HasMaxLength(100).IsRequired();
            e.Property(x => x.PlanNo).HasMaxLength(100);
            e.Property(x => x.StyleName).HasMaxLength(200);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.Property(x => x.SerialRange).HasMaxLength(100);
            e.Property(x => x.CurrentLocation).HasMaxLength(200);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(BundleStatuses.Ready);
            e.Property(x => x.WeightKg).HasPrecision(18, 4);
            e.HasIndex(x => new { x.CompanyId, x.BundleTag }).IsUnique();
            e.HasIndex(x => new { x.CompanyId, x.OrderId });
            e.HasIndex(x => new { x.CompanyId, x.Status, x.CreatedAt });
            e.HasOne(x => x.CuttingPlan).WithMany().HasForeignKey(x => x.CuttingPlanId).OnDelete(DeleteBehavior.Restrict);
        });
        Seed(modelBuilder);
    }

    private static void ConfigureAuditable<TEntity>(ModelBuilder modelBuilder) where TEntity : CuttingService.Domain.AuditableEntity
    {
        modelBuilder.Entity<TEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.RowVersion).IsRowVersion();
            e.HasIndex(x => x.CompanyId);
        });
    }

    private static void Seed(ModelBuilder modelBuilder)
    {
        var companyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var orderId = Guid.Parse("40000000-0000-0000-0000-000000000001");
        var planId = Guid.Parse("41000000-0000-0000-0000-000000000001");
        var createdAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<CuttingPlan>().HasData(new CuttingPlan { Id = planId, CompanyId = companyId, OrderId = orderId, PlanNo = "CP-0001", PlanDate = new DateOnly(2026, 5, 16), ColorName = "Black", TotalPlanQty = 1000, Status = CuttingPlanStatuses.Draft, CreatedAt = createdAt });
        modelBuilder.Entity<CuttingPlanSizeBreakdown>().HasData(new CuttingPlanSizeBreakdown { Id = Guid.Parse("42000000-0000-0000-0000-000000000001"), CompanyId = companyId, CuttingPlanId = planId, SizeName = "M", PlanQty = 1000, CreatedAt = createdAt });
    }
}
