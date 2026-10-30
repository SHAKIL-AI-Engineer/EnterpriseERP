using ProcurementService.Application;
using ProcurementService.Domain;
using Microsoft.EntityFrameworkCore;

namespace ProcurementService.Infrastructure.Persistence;

public sealed class ProcurementDbContext(DbContextOptions<ProcurementDbContext> options) : DbContext(options), IProcurementDbContext
{
    public DbSet<SupplierPurchaseOrder> PurchaseOrders => Set<SupplierPurchaseOrder>();
    public DbSet<SupplierPurchaseOrderLine> PurchaseOrderLines => Set<SupplierPurchaseOrderLine>();

    IQueryable<SupplierPurchaseOrder> IProcurementDbContext.PurchaseOrders => PurchaseOrders;
    IQueryable<SupplierPurchaseOrderLine> IProcurementDbContext.PurchaseOrderLines => PurchaseOrderLines;
    void IProcurementDbContext.Add<T>(T entity) => Set<T>().Add(entity);
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => base.SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SupplierPurchaseOrder>(e =>
        {
            e.ToTable("SupplierPurchaseOrders");
            e.HasKey(x => x.Id);
            e.Property(x => x.PONo).HasMaxLength(100).IsRequired();
            e.Property(x => x.TotalAmount).HasPrecision(18, 4);
            e.HasIndex(x => new { x.CompanyId, x.PONo }).IsUnique();
        });
        modelBuilder.Entity<SupplierPurchaseOrderLine>(e =>
        {
            e.ToTable("SupplierPurchaseOrderLines");
            e.HasKey(x => x.Id);
            e.Property(x => x.Quantity).HasPrecision(18, 4);
            e.Property(x => x.UnitPrice).HasPrecision(18, 4);
            e.Property(x => x.LineTotal).HasPrecision(18, 4);
            e.Property(x => x.ReceivedQty).HasPrecision(18, 4);
            e.HasOne(x => x.PurchaseOrder).WithMany(x => x.Lines).HasForeignKey(x => x.PurchaseOrderId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
