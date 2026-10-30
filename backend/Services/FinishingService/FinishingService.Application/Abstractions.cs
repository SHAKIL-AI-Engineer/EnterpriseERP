using FinishingService.Contracts;
using FinishingService.Domain;

namespace FinishingService.Application;

public interface IFinishingDbContext
{
    IQueryable<FinishingReceive> FinishingReceives { get; }
    IQueryable<FinishingReceiveItem> FinishingReceiveItems { get; }
    IQueryable<FinishingBatch> FinishingBatches { get; }
    IQueryable<FinishingInput> FinishingInputs { get; }
    IQueryable<IroningOutput> IroningOutputs { get; }
    IQueryable<FinishingQC> FinishingQCs { get; }
    IQueryable<FinishingDefect> FinishingDefects { get; }
    IQueryable<FoldingPacking> FoldingPackings { get; }
    IQueryable<CartonPacking> CartonPackings { get; }
    IQueryable<CartonPackingItem> CartonPackingItems { get; }
    IQueryable<FinishedGoodsTransfer> FinishedGoodsTransfers { get; }
    IQueryable<FinishedGoodsTransferItem> FinishedGoodsTransferItems { get; }
    IQueryable<FinishingWastage> FinishingWastages { get; }
    IQueryable<FinishingBalance> FinishingBalances { get; }
    IQueryable<FinishingAuditLog> AuditLogs { get; }
    void Add<TEntity>(TEntity entity) where TEntity : class;
    void Remove<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRepository<TEntity> where TEntity : class
{
    IQueryable<TEntity> Query();
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);
    void Remove(TEntity entity);
}

public interface IUnitOfWork
{
    IRepository<FinishingReceive> FinishingReceives { get; }
    IRepository<FinishingReceiveItem> FinishingReceiveItems { get; }
    IRepository<FinishingBatch> FinishingBatches { get; }
    IRepository<FinishingInput> FinishingInputs { get; }
    IRepository<IroningOutput> IroningOutputs { get; }
    IRepository<FinishingQC> FinishingQCs { get; }
    IRepository<FinishingDefect> FinishingDefects { get; }
    IRepository<FoldingPacking> FoldingPackings { get; }
    IRepository<CartonPacking> CartonPackings { get; }
    IRepository<CartonPackingItem> CartonPackingItems { get; }
    IRepository<FinishedGoodsTransfer> FinishedGoodsTransfers { get; }
    IRepository<FinishedGoodsTransferItem> FinishedGoodsTransferItems { get; }
    IRepository<FinishingWastage> FinishingWastages { get; }
    IRepository<FinishingBalance> Balances { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IIntegrationEventPublisher
{
    Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent;
}

public interface IFinishingBalanceService
{
    Task UpdateReceiveQtyAsync(FinishingReceive receive, CancellationToken cancellationToken = default);
    Task UpdateInputQtyAsync(FinishingInput input, CancellationToken cancellationToken = default);
    Task UpdateIronQtyAsync(IroningOutput ironing, CancellationToken cancellationToken = default);
    Task UpdateQCQtyAsync(FinishingQC qc, CancellationToken cancellationToken = default);
    Task UpdateFoldingQtyAsync(FoldingPacking folding, CancellationToken cancellationToken = default);
    Task UpdateCartonQtyAsync(CartonPacking carton, CancellationToken cancellationToken = default);
    Task UpdateTransferQtyAsync(FinishedGoodsTransfer transfer, CancellationToken cancellationToken = default);
    Task UpdateWastageQtyAsync(FinishingWastage wastage, CancellationToken cancellationToken = default);
    Task SyncSewingOutputAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, int quantity, CancellationToken cancellationToken = default);
}

public interface IMerchandisingServiceClient
{
    Task<OrderSnapshot?> GetOrderAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OrderColorSizeBreakdownSnapshot>> GetOrderColorSizeBreakdownAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
    Task<bool> IsOrderConfirmedAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IProductionServiceClient
{
    Task<SewingOutputSnapshot?> GetSewingOutputAsync(Guid companyId, Guid productionOutputId, CancellationToken cancellationToken = default);
    Task<int> GetOrderProductionBalanceAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IInventoryServiceClient
{
    Task<bool> CreateFinishedGoodsReceiveAsync(Guid companyId, Guid transferId, CancellationToken cancellationToken = default);
    Task<int> GetFinishedGoodsStockAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IShipmentServiceClient
{
    Task<bool> NotifyFinishedGoodsReadyAsync(Guid companyId, Guid orderId, Guid transferId, CancellationToken cancellationToken = default);
    Task<ShipmentPlanSnapshot?> GetShipmentPlanAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IReportExportClient
{
    Task<ReportExportFile> ExportAsync(string title, string format, IReadOnlyList<string> columns, IReadOnlyList<IReadOnlyList<string>> rows, string? bearerToken, CancellationToken cancellationToken = default);
}

public sealed record OrderSnapshot(Guid OrderId, Guid CompanyId, Guid StyleId, string OrderNo, int TotalOrderQty, string OrderStatus);
public sealed record OrderColorSizeBreakdownSnapshot(string? ColorName, string SizeName, int Quantity);
public sealed record SewingOutputSnapshot(Guid ProductionOutputId, Guid CompanyId, Guid OrderId, string? ColorName, string SizeName, int OutputQty);
public sealed record ShipmentPlanSnapshot(Guid OrderId, Guid CompanyId, DateOnly ShipmentDate, int PlanQty);
