using Erp.BuildingBlocks.CommonSecurity;
using MerchandisingService.Application;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace MerchandisingService.Infrastructure.Persistence;

public sealed partial class MerchandisingDbContext(DbContextOptions<MerchandisingDbContext> options, ITenantContext? tenant = null) : TenantDbContext(options, tenant), IMerchandisingDbContext
{
    public DbSet<Buyer> Buyers => Set<Buyer>();
    public DbSet<Season> Seasons => Set<Season>();
    public DbSet<GarmentItem> GarmentItems => Set<GarmentItem>();
    public DbSet<Style> Styles => Set<Style>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<BuyerPurchaseOrder> BuyerPurchaseOrders => Set<BuyerPurchaseOrder>();
    public DbSet<OrderColorSizeBreakdown> OrderColorSizeBreakdowns => Set<OrderColorSizeBreakdown>();
    public DbSet<BomItem> BomItems => Set<BomItem>();
    public DbSet<OrderCosting> OrderCostings => Set<OrderCosting>();
    public DbSet<Sample> Samples => Set<Sample>();
    public DbSet<ShipmentPlan> ShipmentPlans => Set<ShipmentPlan>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<MerchandisingAuditLog> AuditLogs => Set<MerchandisingAuditLog>();

    IQueryable<Buyer> IMerchandisingDbContext.Buyers => Buyers;
    IQueryable<Season> IMerchandisingDbContext.Seasons => Seasons;
    IQueryable<GarmentItem> IMerchandisingDbContext.GarmentItems => GarmentItems;
    IQueryable<Style> IMerchandisingDbContext.Styles => Styles;
    IQueryable<Order> IMerchandisingDbContext.Orders => Orders;
    IQueryable<BuyerPurchaseOrder> IMerchandisingDbContext.BuyerPurchaseOrders => BuyerPurchaseOrders;
    IQueryable<OrderColorSizeBreakdown> IMerchandisingDbContext.OrderColorSizeBreakdowns => OrderColorSizeBreakdowns;
    IQueryable<BomItem> IMerchandisingDbContext.BomItems => BomItems;
    IQueryable<OrderCosting> IMerchandisingDbContext.OrderCostings => OrderCostings;
    IQueryable<Sample> IMerchandisingDbContext.Samples => Samples;
    IQueryable<ShipmentPlan> IMerchandisingDbContext.ShipmentPlans => ShipmentPlans;
    IQueryable<OrderStatusHistory> IMerchandisingDbContext.OrderStatusHistories => OrderStatusHistories;
    IQueryable<MerchandisingAuditLog> IMerchandisingDbContext.AuditLogs => AuditLogs;

    void IMerchandisingDbContext.Add<TEntity>(TEntity entity) => Set<TEntity>().Add(entity);
    void IMerchandisingDbContext.Remove<TEntity>(TEntity entity) => Set<TEntity>().Remove(entity);

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        AddAuditEntries();
        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ConfigureAuditable<Buyer>(modelBuilder);
        ConfigureAuditable<Season>(modelBuilder);
        ConfigureAuditable<GarmentItem>(modelBuilder);
        ConfigureAuditable<Style>(modelBuilder);
        ConfigureAuditable<Order>(modelBuilder);
        ConfigureAuditable<BuyerPurchaseOrder>(modelBuilder);
        ConfigureAuditable<OrderColorSizeBreakdown>(modelBuilder);
        ConfigureAuditable<BomItem>(modelBuilder);
        ConfigureAuditable<OrderCosting>(modelBuilder);
        ConfigureAuditable<Sample>(modelBuilder);
        ConfigureAuditable<ShipmentPlan>(modelBuilder);

        modelBuilder.Entity<Buyer>(e =>
        {
            e.ToTable("Buyers");
            e.Property(x => x.BuyerCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.BuyerName).HasMaxLength(150).IsRequired();
            e.Property(x => x.Country).HasMaxLength(100);
            e.Property(x => x.ContactPerson).HasMaxLength(150);
            e.Property(x => x.Email).HasMaxLength(150);
            e.Property(x => x.Phone).HasMaxLength(50);
            e.Property(x => x.Address).HasMaxLength(300);
            e.HasIndex(x => new { x.CompanyId, x.BuyerCode }).IsUnique();
        });

        modelBuilder.Entity<Season>(e =>
        {
            e.ToTable("Seasons");
            e.Property(x => x.SeasonCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.SeasonName).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.SeasonCode }).IsUnique();
        });

        modelBuilder.Entity<GarmentItem>(e =>
        {
            e.ToTable("GarmentItems");
            e.Property(x => x.ItemCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.ItemName).HasMaxLength(150).IsRequired();
            e.Property(x => x.Category).HasMaxLength(100);
            e.HasIndex(x => new { x.CompanyId, x.ItemCode }).IsUnique();
        });

        modelBuilder.Entity<Style>(e =>
        {
            e.ToTable("Styles");
            e.Property(x => x.StyleNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.StyleName).HasMaxLength(150);
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.FabricDescription).HasMaxLength(500);
            e.HasIndex(x => new { x.BuyerId, x.StyleNo }).IsUnique();
            e.HasOne(x => x.Buyer).WithMany(x => x.Styles).HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Season).WithMany().HasForeignKey(x => x.SeasonId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.GarmentItem).WithMany().HasForeignKey(x => x.GarmentItemId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Order>(e =>
        {
            e.ToTable("Orders");
            e.Property(x => x.OrderNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.UnitPrice).HasPrecision(18, 4);
            e.Property(x => x.TotalValue).HasPrecision(18, 4);
            e.Property(x => x.CurrencyCode).HasMaxLength(10).HasDefaultValue("USD");
            e.Property(x => x.OrderStatus).HasMaxLength(50).HasDefaultValue(OrderStatuses.Draft);
            e.HasIndex(x => new { x.CompanyId, x.OrderNo }).IsUnique();
            e.HasOne(x => x.Buyer).WithMany(x => x.Orders).HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Style).WithMany().HasForeignKey(x => x.StyleId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BuyerPurchaseOrder>(e =>
        {
            e.ToTable("BuyerPurchaseOrders");
            e.Property(x => x.PONo).HasMaxLength(100).IsRequired();
            e.Property(x => x.UnitPrice).HasPrecision(18, 4);
            e.Property(x => x.TotalValue).HasPrecision(18, 4);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(BuyerPoStatuses.Open);
            e.HasIndex(x => new { x.OrderId, x.PONo }).IsUnique();
            e.HasOne(x => x.Order).WithMany(x => x.BuyerPurchaseOrders).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderColorSizeBreakdown>(e =>
        {
            e.ToTable("OrderColorSizeBreakdowns");
            e.Property(x => x.ColorName).HasMaxLength(100).IsRequired();
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.Order).WithMany(x => x.ColorSizeBreakdowns).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.BuyerPurchaseOrder).WithMany().HasForeignKey(x => x.BuyerPurchaseOrderId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BomItem>(e =>
        {
            e.ToTable("BOMItems");
            e.Property(x => x.ItemType).HasMaxLength(50).IsRequired();
            e.Property(x => x.ItemCode).HasMaxLength(100);
            e.Property(x => x.ItemName).HasMaxLength(150).IsRequired();
            e.Property(x => x.UnitName).HasMaxLength(50).IsRequired();
            e.Property(x => x.Consumption).HasPrecision(18, 4);
            e.Property(x => x.WastagePercent).HasPrecision(18, 2);
            e.Property(x => x.RequiredQty).HasPrecision(18, 4);
            e.Property(x => x.UnitPrice).HasPrecision(18, 4);
            e.Property(x => x.TotalCost).HasPrecision(18, 4);
            e.HasOne(x => x.Order).WithMany(x => x.BomItems).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderCosting>(e =>
        {
            e.ToTable("OrderCostings");
            e.HasIndex(x => x.OrderId).IsUnique();
            e.Property(x => x.FabricCost).HasPrecision(18, 4);
            e.Property(x => x.AccessoriesCost).HasPrecision(18, 4);
            e.Property(x => x.CM).HasPrecision(18, 4);
            e.Property(x => x.WashingCost).HasPrecision(18, 4);
            e.Property(x => x.EmbroideryCost).HasPrecision(18, 4);
            e.Property(x => x.PrintingCost).HasPrecision(18, 4);
            e.Property(x => x.OtherCost).HasPrecision(18, 4);
            e.Property(x => x.TotalCost).HasPrecision(18, 4);
            e.Property(x => x.SellingPrice).HasPrecision(18, 4);
            e.Property(x => x.ProfitAmount).HasPrecision(18, 4);
            e.Property(x => x.ProfitPercent).HasPrecision(18, 2);
            e.Property(x => x.ApprovalStatus).HasMaxLength(50).HasDefaultValue(CostingApprovalStatuses.Draft);
            e.HasOne(x => x.Order).WithOne(x => x.Costing).HasForeignKey<OrderCosting>(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Sample>(e =>
        {
            e.ToTable("Samples");
            e.Property(x => x.SampleType).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(SampleStatuses.Pending);
            e.Property(x => x.Remarks).HasMaxLength(500);
            e.HasOne(x => x.Buyer).WithMany().HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Style).WithMany().HasForeignKey(x => x.StyleId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ShipmentPlan>(e =>
        {
            e.ToTable("ShipmentPlans");
            e.Property(x => x.ShipmentMode).HasMaxLength(50);
            e.Property(x => x.Destination).HasMaxLength(150);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(ShipmentPlanStatuses.Planned);
            e.HasOne(x => x.Order).WithMany(x => x.ShipmentPlans).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.BuyerPurchaseOrder).WithMany().HasForeignKey(x => x.BuyerPurchaseOrderId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderStatusHistory>(e =>
        {
            e.ToTable("OrderStatusHistories");
            e.HasKey(x => x.Id);
            e.Property(x => x.FromStatus).HasMaxLength(50);
            e.Property(x => x.ToStatus).HasMaxLength(50).IsRequired();
            e.Property(x => x.Reason).HasMaxLength(300);
            e.Property(x => x.ChangedBy).HasMaxLength(150);
            e.HasIndex(x => new { x.CompanyId, x.OrderId, x.ChangedAt });
        });

        modelBuilder.Entity<MerchandisingAuditLog>(e =>
        {
            e.ToTable("MerchandisingAuditLogs");
            e.HasKey(x => x.Id);
            e.Property(x => x.EntityName).HasMaxLength(120).IsRequired();
            e.Property(x => x.Action).HasMaxLength(50).IsRequired();
            e.Property(x => x.UserName).HasMaxLength(150);
        });

        Seed(modelBuilder);
        ApplyCompanyFilters(modelBuilder);
        ConfigureExtendedEntities(modelBuilder);
        ConfigurePhase1213Entities(modelBuilder);
    }

    partial void ConfigureExtendedEntities(ModelBuilder modelBuilder);
    partial void ConfigurePhase1213Entities(ModelBuilder modelBuilder);

    private void AddAuditEntries()
    {
        var entries = ChangeTracker.Entries<MerchandisingService.Domain.AuditableEntity>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        foreach (var entry in entries)
        {
            var entity = entry.Entity;
            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = BusinessTime.Now;
            }

            if (entry.State == EntityState.Modified)
            {
                entity.UpdatedAt = BusinessTime.Now;
            }

            AuditLogs.Add(new MerchandisingAuditLog
            {
                CompanyId = entity.CompanyId,
                EntityName = entry.Entity.GetType().Name,
                EntityId = entity.Id,
                Action = entry.State.ToString(),
            });
        }
    }

    private static void ConfigureAuditable<TEntity>(ModelBuilder modelBuilder) where TEntity : MerchandisingService.Domain.AuditableEntity
    {
        modelBuilder.Entity<TEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.CompanyId).IsRequired();
            e.Property(x => x.CreatedBy).HasMaxLength(150);
            e.Property(x => x.UpdatedBy).HasMaxLength(150);
            e.Property(x => x.RowVersion).IsRowVersion();
            e.HasIndex(x => x.CompanyId);
        });
    }

    private static void Seed(ModelBuilder modelBuilder)
    {
        var companyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var buyerId = Guid.Parse("30000000-0000-0000-0000-000000000001");
        var seasonId = Guid.Parse("31000000-0000-0000-0000-000000000001");
        var itemId = Guid.Parse("32000000-0000-0000-0000-000000000001");
        var styleId = Guid.Parse("33000000-0000-0000-0000-000000000001");

        modelBuilder.Entity<Buyer>().HasData(new Buyer { Id = buyerId, CompanyId = companyId, BuyerCode = "HNM", BuyerName = "H&M", Country = "Sweden", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
        modelBuilder.Entity<Season>().HasData(new Season { Id = seasonId, CompanyId = companyId, SeasonCode = "SS26", SeasonName = "Spring Summer", YearNo = 2026, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
        modelBuilder.Entity<GarmentItem>().HasData(new GarmentItem { Id = itemId, CompanyId = companyId, ItemCode = "TSHIRT", ItemName = "T-Shirt", Category = "Knit", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
        modelBuilder.Entity<Style>().HasData(new Style { Id = styleId, CompanyId = companyId, BuyerId = buyerId, SeasonId = seasonId, GarmentItemId = itemId, StyleNo = "ST-SS26-001", StyleName = "Basic Crew Neck Tee", FabricDescription = "160 GSM single jersey", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
    }
}
