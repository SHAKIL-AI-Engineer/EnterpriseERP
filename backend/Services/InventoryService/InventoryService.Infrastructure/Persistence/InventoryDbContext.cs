using InventoryService.Application;
using InventoryService.Domain;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Infrastructure.Persistence;

public sealed class InventoryDbContext(DbContextOptions<InventoryDbContext> options) : DbContext(options), IInventoryDbContext
{
    public DbSet<StockItem> StockItems => Set<StockItem>();
    public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();

    IQueryable<StockItem> IInventoryDbContext.StockItems => StockItems;
    IQueryable<StockTransaction> IInventoryDbContext.StockTransactions => StockTransactions;
    void IInventoryDbContext.Add<T>(T entity) => Set<T>().Add(entity);
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => base.SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StockItem>(e =>
        {
            e.ToTable("StockItems");
            e.HasKey(x => x.Id);
            e.Property(x => x.ItemCode).HasMaxLength(100).IsRequired();
            e.Property(x => x.BalanceQty).HasPrecision(18, 4);
            e.HasIndex(x => new { x.CompanyId, x.ItemCode }).IsUnique();
        });
        modelBuilder.Entity<StockTransaction>(e =>
        {
            e.ToTable("StockTransactions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Quantity).HasPrecision(18, 4);
            e.HasOne(x => x.StockItem).WithMany(x => x.Transactions).HasForeignKey(x => x.StockItemId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
