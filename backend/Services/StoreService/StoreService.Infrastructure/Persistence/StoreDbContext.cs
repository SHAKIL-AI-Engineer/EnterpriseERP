using Microsoft.EntityFrameworkCore;
using StoreService.Application;
using StoreService.Domain;

namespace StoreService.Infrastructure.Persistence;

public sealed class StoreDbContext(DbContextOptions<StoreDbContext> options) : DbContext(options), IStoreDbContext
{
    public DbSet<ItemCategory> Categories => Set<ItemCategory>();
    public DbSet<StoreUnit> Units => Set<StoreUnit>();
    public DbSet<StoreItem> Items => Set<StoreItem>();
    public DbSet<StoreBuyer> Buyers => Set<StoreBuyer>();
    public DbSet<StoreOrder> Orders => Set<StoreOrder>();
    public DbSet<StoreOrderLine> OrderLines => Set<StoreOrderLine>();
    public DbSet<StoreBooking> Bookings => Set<StoreBooking>();
    public DbSet<GoodsReceiptNote> Grns => Set<GoodsReceiptNote>();
    public DbSet<GrnLine> GrnLines => Set<GrnLine>();
    public DbSet<StoreStockTransaction> Transactions => Set<StoreStockTransaction>();

    IQueryable<ItemCategory> IStoreDbContext.Categories => Categories;
    IQueryable<StoreUnit> IStoreDbContext.Units => Units;
    IQueryable<StoreItem> IStoreDbContext.Items => Items;
    IQueryable<StoreBuyer> IStoreDbContext.Buyers => Buyers;
    IQueryable<StoreOrder> IStoreDbContext.Orders => Orders;
    IQueryable<StoreOrderLine> IStoreDbContext.OrderLines => OrderLines;
    IQueryable<StoreBooking> IStoreDbContext.Bookings => Bookings;
    IQueryable<GoodsReceiptNote> IStoreDbContext.Grns => Grns;
    IQueryable<GrnLine> IStoreDbContext.GrnLines => GrnLines;
    IQueryable<StoreStockTransaction> IStoreDbContext.Transactions => Transactions;

    void IStoreDbContext.Add<T>(T entity) => Set<T>().Add(entity);
    void IStoreDbContext.Remove<T>(T entity) => Set<T>().Remove(entity);
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => base.SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(AuditableEntity).IsAssignableFrom(entity.ClrType))
            {
                modelBuilder.Entity(entity.ClrType).Property(nameof(AuditableEntity.RowVersion)).IsRowVersion();
            }
        }

        modelBuilder.Entity<ItemCategory>(e =>
        {
            e.ToTable("ItemCategories");
            e.HasKey(x => x.Id);
            e.Property(x => x.CategoryName).HasMaxLength(200).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.CategoryName });
        });

        modelBuilder.Entity<StoreUnit>(e =>
        {
            e.ToTable("StoreUnits");
            e.HasKey(x => x.Id);
            e.Property(x => x.UnitName).HasMaxLength(100).IsRequired();
            e.Property(x => x.ShortName).HasMaxLength(20).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.ShortName });
        });

        modelBuilder.Entity<StoreItem>(e =>
        {
            e.ToTable("StoreItems");
            e.HasKey(x => x.Id);
            e.Property(x => x.ItemCode).HasMaxLength(100).IsRequired();
            e.Property(x => x.ItemName).HasMaxLength(300).IsRequired();
            e.Property(x => x.OpeningStock).HasPrecision(18, 4);
            e.Property(x => x.CurrentStock).HasPrecision(18, 4);
            e.Property(x => x.MinimumStockLevel).HasPrecision(18, 4);
            e.Property(x => x.UnitPrice).HasPrecision(18, 4);
            e.HasIndex(x => new { x.CompanyId, x.ItemCode }).IsUnique();
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Unit).WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StoreBuyer>(e =>
        {
            e.ToTable("StoreBuyers");
            e.HasKey(x => x.Id);
            e.Property(x => x.BuyerName).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<StoreOrder>(e =>
        {
            e.ToTable("StoreOrders");
            e.HasKey(x => x.Id);
            e.Property(x => x.OrderNumber).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.OrderNumber }).IsUnique();
            e.HasOne(x => x.Buyer).WithMany().HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(x => x.Lines).WithOne(x => x.Order).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StoreOrderLine>(e =>
        {
            e.ToTable("StoreOrderLines");
            e.HasKey(x => x.Id);
            e.Property(x => x.Quantity).HasPrecision(18, 4);
            e.Property(x => x.UnitPrice).HasPrecision(18, 4);
            e.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StoreBooking>(e =>
        {
            e.ToTable("StoreBookings");
            e.HasKey(x => x.Id);
            e.Property(x => x.BookingNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.BookedQuantity).HasPrecision(18, 4);
            e.Property(x => x.IssuedQty).HasPrecision(18, 4);
            e.HasIndex(x => new { x.CompanyId, x.BookingNumber });
            e.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GoodsReceiptNote>(e =>
        {
            e.ToTable("GoodsReceiptNotes");
            e.HasKey(x => x.Id);
            e.Property(x => x.GrnNo).HasMaxLength(50).IsRequired();
            e.Property(x => x.TotalAmount).HasPrecision(18, 4);
            e.HasIndex(x => new { x.CompanyId, x.GrnNo }).IsUnique();
            e.HasMany(x => x.Lines).WithOne(x => x.Grn).HasForeignKey(x => x.GrnId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GrnLine>(e =>
        {
            e.ToTable("GrnLines");
            e.HasKey(x => x.Id);
            e.Property(x => x.Quantity).HasPrecision(18, 4);
            e.Property(x => x.Rate).HasPrecision(18, 4);
        });

        modelBuilder.Entity<StoreStockTransaction>(e =>
        {
            e.ToTable("StoreStockTransactions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Quantity).HasPrecision(18, 4);
            e.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
