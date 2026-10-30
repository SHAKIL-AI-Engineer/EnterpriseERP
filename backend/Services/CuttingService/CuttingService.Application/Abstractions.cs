using CuttingService.Contracts;
using CuttingService.Domain;

namespace CuttingService.Application;

public interface ICuttingDbContext
{
    IQueryable<CuttingPlan> CuttingPlans { get; }
    IQueryable<CuttingPlanSizeBreakdown> CuttingPlanSizeBreakdowns { get; }
    IQueryable<FabricIssueToCutting> FabricIssuesToCutting { get; }
    IQueryable<CuttingLay> CuttingLays { get; }
    IQueryable<CuttingLaySizeDetail> CuttingLaySizeDetails { get; }
    IQueryable<CuttingOutput> CuttingOutputs { get; }
    IQueryable<CuttingWastage> CuttingWastages { get; }
    IQueryable<CuttingBalance> CuttingBalances { get; }
    IQueryable<CuttingPanelTransfer> CuttingPanelTransfers { get; }
    IQueryable<CuttingPanelTransferItem> CuttingPanelTransferItems { get; }
    IQueryable<CuttingAuditLog> AuditLogs { get; }
    IQueryable<CuttingBundle> CuttingBundles { get; }
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
    IRepository<CuttingPlan> CuttingPlans { get; }
    IRepository<CuttingPlanSizeBreakdown> SizeBreakdowns { get; }
    IRepository<FabricIssueToCutting> FabricIssues { get; }
    IRepository<CuttingLay> Lays { get; }
    IRepository<CuttingOutput> Outputs { get; }
    IRepository<CuttingWastage> Wastages { get; }
    IRepository<CuttingBalance> Balances { get; }
    IRepository<CuttingPanelTransfer> PanelTransfers { get; }
    IRepository<CuttingBundle> Bundles { get; }
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

public interface ICuttingBalanceService
{
    Task UpdatePlanQtyAsync(CuttingPlan plan, CancellationToken cancellationToken = default);
    Task AddOutputAsync(CuttingOutput output, int orderQty, CancellationToken cancellationToken = default);
    Task AddTransferAsync(CuttingPanelTransfer transfer, CancellationToken cancellationToken = default);
}

public interface IMerchandisingServiceClient
{
    Task<OrderSnapshot?> GetOrderAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OrderColorSizeBreakdownSnapshot>> GetOrderColorSizeBreakdownAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
    Task<bool> IsOrderConfirmedAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IInventoryServiceClient
{
    Task<FabricIssueSnapshot?> GetFabricIssueAsync(Guid companyId, Guid inventoryIssueId, CancellationToken cancellationToken = default);
    Task<decimal> GetStockBalanceAsync(Guid companyId, Guid itemId, Guid orderId, CancellationToken cancellationToken = default);
    Task<Guid?> RequestFabricIssueAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IProductionServiceClient
{
    Task NotifyPanelTransferAsync(Guid companyId, Guid orderId, Guid transferId, CancellationToken cancellationToken = default);
}

public interface IReportExportClient
{
    Task<ReportExportFile> ExportAsync(string title, string format, IReadOnlyList<string> columns, IReadOnlyList<IReadOnlyList<string>> rows, string? bearerToken, CancellationToken cancellationToken = default);
}

public sealed record OrderSnapshot(Guid OrderId, Guid CompanyId, Guid StyleId, string OrderNo, int TotalOrderQty, string OrderStatus);
public sealed record OrderColorSizeBreakdownSnapshot(string? ColorName, string SizeName, int Quantity);
public sealed record FabricIssueSnapshot(Guid InventoryIssueId, Guid CompanyId, Guid OrderId, Guid FabricItemId, decimal IssueQty, string UnitName);
