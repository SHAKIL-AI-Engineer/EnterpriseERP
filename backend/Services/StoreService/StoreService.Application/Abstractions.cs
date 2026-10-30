using StoreService.Domain;

namespace StoreService.Application;

public interface IStoreDbContext
{
    IQueryable<ItemCategory> Categories { get; }
    IQueryable<StoreUnit> Units { get; }
    IQueryable<StoreItem> Items { get; }
    IQueryable<StoreBuyer> Buyers { get; }
    IQueryable<StoreOrder> Orders { get; }
    IQueryable<StoreOrderLine> OrderLines { get; }
    IQueryable<StoreBooking> Bookings { get; }
    IQueryable<GoodsReceiptNote> Grns { get; }
    IQueryable<GrnLine> GrnLines { get; }
    IQueryable<StoreStockTransaction> Transactions { get; }
    void Add<T>(T entity) where T : class;
    void Remove<T>(T entity) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IInventorySyncClient
{
    Task<Guid?> ReceiveAsync(Guid companyId, string itemCode, string itemName, string unitName, decimal quantity, string? referenceNo, CancellationToken cancellationToken);
    Task IssueAsync(Guid companyId, Guid inventoryItemId, decimal quantity, string? referenceNo, CancellationToken cancellationToken);
}
