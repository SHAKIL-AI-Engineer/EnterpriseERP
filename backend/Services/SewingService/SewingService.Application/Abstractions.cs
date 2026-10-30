using SewingService.Domain;

namespace SewingService.Application;

public interface ISewingDbContext
{
    IQueryable<SewingLine> SewingLines { get; }
    IQueryable<ProductionAssignment> ProductionAssignments { get; }
    IQueryable<ProductionTarget> ProductionTargets { get; }
    IQueryable<DailyProductionRecord> DailyProductionRecords { get; }
    IQueryable<SewingOutput> SewingOutputs { get; }
    IQueryable<PanelTransferReceipt> PanelTransferReceipts { get; }
    IQueryable<SewingBalance> SewingBalances { get; }
    void Add<TEntity>(TEntity entity) where TEntity : class;
    void Remove<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    IQueryable<T> Query();
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);
}

public interface IUnitOfWork
{
    IRepository<SewingLine> SewingLines { get; }
    IRepository<ProductionAssignment> Assignments { get; }
    IRepository<ProductionTarget> Targets { get; }
    IRepository<DailyProductionRecord> DailyRecords { get; }
    IRepository<SewingOutput> Outputs { get; }
    IRepository<PanelTransferReceipt> PanelReceipts { get; }
    IRepository<SewingBalance> Balances { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ISewingBalanceService
{
    Task<SewingBalance> GetOrCreateAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, CancellationToken ct = default);
    Task AddPanelReceivedAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, int qty, CancellationToken ct = default);
    Task AddSewnOutputAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, int qty, CancellationToken ct = default);
}

public interface IIntegrationEventPublisher
{
    Task PublishAsync<T>(T integrationEvent, CancellationToken cancellationToken = default) where T : class;
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IMerchandisingServiceClient
{
    Task<bool> IsOrderConfirmedAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IReportExportClient
{
    Task<ReportExportFile> ExportAsync(string title, string format, IReadOnlyList<string> columns, IReadOnlyList<IReadOnlyList<string>> rows, string? bearerToken, CancellationToken cancellationToken = default);
}

public sealed record ReportExportFile(byte[] Content, string ContentType, string FileName);
