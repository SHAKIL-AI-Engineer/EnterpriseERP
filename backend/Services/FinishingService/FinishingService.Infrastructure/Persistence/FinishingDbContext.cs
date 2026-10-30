using FinishingService.Application;
using FinishingService.Domain;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace FinishingService.Infrastructure.Persistence;

public sealed class FinishingDbContext(DbContextOptions<FinishingDbContext> options) : DbContext(options), IFinishingDbContext
{
    public DbSet<FinishingReceive> FinishingReceives => Set<FinishingReceive>();
    public DbSet<FinishingReceiveItem> FinishingReceiveItems => Set<FinishingReceiveItem>();
    public DbSet<FinishingBatch> FinishingBatches => Set<FinishingBatch>();
    public DbSet<FinishingInput> FinishingInputs => Set<FinishingInput>();
    public DbSet<IroningOutput> IroningOutputs => Set<IroningOutput>();
    public DbSet<FinishingQC> FinishingQCs => Set<FinishingQC>();
    public DbSet<FinishingDefect> FinishingDefects => Set<FinishingDefect>();
    public DbSet<FoldingPacking> FoldingPackings => Set<FoldingPacking>();
    public DbSet<CartonPacking> CartonPackings => Set<CartonPacking>();
    public DbSet<CartonPackingItem> CartonPackingItems => Set<CartonPackingItem>();
    public DbSet<FinishedGoodsTransfer> FinishedGoodsTransfers => Set<FinishedGoodsTransfer>();
    public DbSet<FinishedGoodsTransferItem> FinishedGoodsTransferItems => Set<FinishedGoodsTransferItem>();
    public DbSet<FinishingWastage> FinishingWastages => Set<FinishingWastage>();
    public DbSet<FinishingBalance> FinishingBalances => Set<FinishingBalance>();
    public DbSet<FinishingAuditLog> AuditLogs => Set<FinishingAuditLog>();

    IQueryable<FinishingReceive> IFinishingDbContext.FinishingReceives => FinishingReceives;
    IQueryable<FinishingReceiveItem> IFinishingDbContext.FinishingReceiveItems => FinishingReceiveItems;
    IQueryable<FinishingBatch> IFinishingDbContext.FinishingBatches => FinishingBatches;
    IQueryable<FinishingInput> IFinishingDbContext.FinishingInputs => FinishingInputs;
    IQueryable<IroningOutput> IFinishingDbContext.IroningOutputs => IroningOutputs;
    IQueryable<FinishingQC> IFinishingDbContext.FinishingQCs => FinishingQCs;
    IQueryable<FinishingDefect> IFinishingDbContext.FinishingDefects => FinishingDefects;
    IQueryable<FoldingPacking> IFinishingDbContext.FoldingPackings => FoldingPackings;
    IQueryable<CartonPacking> IFinishingDbContext.CartonPackings => CartonPackings;
    IQueryable<CartonPackingItem> IFinishingDbContext.CartonPackingItems => CartonPackingItems;
    IQueryable<FinishedGoodsTransfer> IFinishingDbContext.FinishedGoodsTransfers => FinishedGoodsTransfers;
    IQueryable<FinishedGoodsTransferItem> IFinishingDbContext.FinishedGoodsTransferItems => FinishedGoodsTransferItems;
    IQueryable<FinishingWastage> IFinishingDbContext.FinishingWastages => FinishingWastages;
    IQueryable<FinishingBalance> IFinishingDbContext.FinishingBalances => FinishingBalances;
    IQueryable<FinishingAuditLog> IFinishingDbContext.AuditLogs => AuditLogs;

    void IFinishingDbContext.Add<TEntity>(TEntity entity) => Set<TEntity>().Add(entity);
    void IFinishingDbContext.Remove<TEntity>(TEntity entity) => Set<TEntity>().Remove(entity);

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<FinishingService.Domain.AuditableEntity>().Where(x => x.State is EntityState.Added or EntityState.Modified))
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = BusinessTime.Now;
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = BusinessTime.Now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureAuditable<FinishingReceive>(modelBuilder);
        ConfigureAuditable<FinishingReceiveItem>(modelBuilder);
        ConfigureAuditable<FinishingBatch>(modelBuilder);
        ConfigureAuditable<FinishingInput>(modelBuilder);
        ConfigureAuditable<IroningOutput>(modelBuilder);
        ConfigureAuditable<FinishingQC>(modelBuilder);
        ConfigureAuditable<FinishingDefect>(modelBuilder);
        ConfigureAuditable<FoldingPacking>(modelBuilder);
        ConfigureAuditable<CartonPacking>(modelBuilder);
        ConfigureAuditable<CartonPackingItem>(modelBuilder);
        ConfigureAuditable<FinishedGoodsTransfer>(modelBuilder);
        ConfigureAuditable<FinishedGoodsTransferItem>(modelBuilder);
        ConfigureAuditable<FinishingWastage>(modelBuilder);

        modelBuilder.Entity<FinishingReceive>(e =>
        {
            e.ToTable("FinishingReceives");
            e.Property(x => x.ReceiveNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.FromDepartment).HasMaxLength(100).HasDefaultValue("Sewing");
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(FinishingReceiveStatuses.Draft);
            e.HasIndex(x => new { x.CompanyId, x.ReceiveNo }).IsUnique();
        });

        modelBuilder.Entity<FinishingReceiveItem>(e =>
        {
            e.ToTable("FinishingReceiveItems");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.FinishingReceive).WithMany(x => x.Items).HasForeignKey(x => x.FinishingReceiveId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FinishingBatch>(e =>
        {
            e.ToTable("FinishingBatches");
            e.Property(x => x.BatchNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(FinishingBatchStatuses.Draft);
            e.HasIndex(x => new { x.CompanyId, x.BatchNo }).IsUnique();
        });

        modelBuilder.Entity<FinishingInput>(e =>
        {
            e.ToTable("FinishingInputs");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.FinishingBatch).WithMany(x => x.Inputs).HasForeignKey(x => x.FinishingBatchId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IroningOutput>(e =>
        {
            e.ToTable("IroningOutputs");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.FinishingBatch).WithMany(x => x.Ironings).HasForeignKey(x => x.FinishingBatchId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FinishingQC>(e =>
        {
            e.ToTable("FinishingQCs");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.FinishingBatch).WithMany(x => x.QCs).HasForeignKey(x => x.FinishingBatchId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FinishingDefect>(e =>
        {
            e.ToTable("FinishingDefects");
            e.Property(x => x.DefectType).HasMaxLength(100).IsRequired();
            e.Property(x => x.Remarks).HasMaxLength(300);
            e.HasOne(x => x.FinishingQC).WithMany(x => x.Defects).HasForeignKey(x => x.FinishingQCId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FoldingPacking>(e =>
        {
            e.ToTable("FoldingPackings");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.FinishingBatch).WithMany(x => x.Foldings).HasForeignKey(x => x.FinishingBatchId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartonPacking>(e =>
        {
            e.ToTable("CartonPackings");
            e.Property(x => x.CartonNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.CartonType).HasMaxLength(100);
            e.Property(x => x.GrossWeight).HasPrecision(12, 4);
            e.Property(x => x.NetWeight).HasPrecision(12, 4);
            e.Property(x => x.CBM).HasPrecision(12, 6);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(CartonPackingStatuses.Open);
            e.HasIndex(x => new { x.CompanyId, x.CartonNo }).IsUnique();
        });

        modelBuilder.Entity<CartonPackingItem>(e =>
        {
            e.ToTable("CartonPackingItems");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.CartonPacking).WithMany(x => x.Items).HasForeignKey(x => x.CartonPackingId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FinishedGoodsTransfer>(e =>
        {
            e.ToTable("FinishedGoodsTransfers");
            e.Property(x => x.TransferNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.ToDepartment).HasMaxLength(100).HasDefaultValue("FinishedGoods");
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(FinishedGoodsTransferStatuses.Draft);
            e.HasIndex(x => new { x.CompanyId, x.TransferNo }).IsUnique();
        });

        modelBuilder.Entity<FinishedGoodsTransferItem>(e =>
        {
            e.ToTable("FinishedGoodsTransferItems");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.FinishedGoodsTransfer).WithMany(x => x.Items).HasForeignKey(x => x.FinishedGoodsTransferId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FinishingWastage>(e =>
        {
            e.ToTable("FinishingWastages");
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50);
            e.Property(x => x.WastageReason).HasMaxLength(300).IsRequired();
        });

        modelBuilder.Entity<FinishingBalance>(e =>
        {
            e.ToTable("FinishingBalances");
            e.HasKey(x => x.Id);
            e.Property(x => x.ColorName).HasMaxLength(100);
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.OrderId, x.BuyerPurchaseOrderId, x.ColorName, x.SizeName }).IsUnique();
        });

        modelBuilder.Entity<FinishingAuditLog>(e =>
        {
            e.ToTable("FinishingAuditLogs");
            e.HasKey(x => x.Id);
            e.Property(x => x.EntityName).HasMaxLength(120).IsRequired();
            e.Property(x => x.Action).HasMaxLength(50).IsRequired();
            e.Property(x => x.Remarks).HasMaxLength(500);
        });

        Seed(modelBuilder);
    }

    private static void ConfigureAuditable<TEntity>(ModelBuilder modelBuilder) where TEntity : FinishingService.Domain.AuditableEntity
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
        var receiveId = Guid.Parse("50000000-0000-0000-0000-000000000001");
        var batchId = Guid.Parse("60000000-0000-0000-0000-000000000001");
        var createdAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<FinishingReceive>().HasData(new FinishingReceive
        {
            Id = receiveId,
            CompanyId = companyId,
            OrderId = orderId,
            ReceiveNo = "FRC-0001",
            ReceiveDate = new DateOnly(2026, 5, 16),
            FromDepartment = "Sewing",
            TotalReceiveQty = 1000,
            Status = FinishingReceiveStatuses.Draft,
            CreatedAt = createdAt
        });

        modelBuilder.Entity<FinishingReceiveItem>().HasData(new FinishingReceiveItem
        {
            Id = Guid.Parse("51000000-0000-0000-0000-000000000001"),
            CompanyId = companyId,
            FinishingReceiveId = receiveId,
            OrderId = orderId,
            ColorName = "Black",
            SizeName = "M",
            ReceiveQty = 1000,
            CreatedAt = createdAt
        });

        modelBuilder.Entity<FinishingBatch>().HasData(new FinishingBatch
        {
            Id = batchId,
            CompanyId = companyId,
            OrderId = orderId,
            BatchNo = "FB-0001",
            BatchDate = new DateOnly(2026, 5, 16),
            TotalInputQty = 1000,
            Status = FinishingBatchStatuses.Draft,
            CreatedAt = createdAt
        });

        modelBuilder.Entity<FinishingBalance>().HasData(new FinishingBalance
        {
            Id = Guid.Parse("70000000-0000-0000-0000-000000000001"),
            CompanyId = companyId,
            OrderId = orderId,
            ColorName = "Black",
            SizeName = "M",
            SewingOutputQty = 1000,
            FinishingReceiveQty = 0,
            BalanceQty = 0
        });
    }
}
