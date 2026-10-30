using Microsoft.EntityFrameworkCore;
using QualityService.Domain;
using QualityService.Contracts;

namespace QualityService.Application;

public interface IQualityDbContext
{
    DbSet<QualityCheckpoint> QualityCheckpoints { get; }
    DbSet<DefectCategory> DefectCategories { get; }
    DbSet<DefectType> DefectTypes { get; }
    DbSet<QualityInspection> QualityInspections { get; }
    DbSet<QualityInspectionDefect> QualityInspectionDefects { get; }
    DbSet<QualityRework> QualityReworks { get; }
    DbSet<QualityReject> QualityRejects { get; }
    DbSet<AQLStandard> AQLStandards { get; }
    DbSet<FinalInspection> FinalInspections { get; }
    DbSet<QualityAuditLog> QualityAuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    void Add<T>(T entity) where T : class;
    void Update<T>(T entity) where T : class;
    void Remove<T>(T entity) where T : class;
}

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> ListAsync(CancellationToken ct = default);
    void Add(T entity);
    void Update(T entity);
    void Delete(T entity);
}

public interface IUnitOfWork : IDisposable
{
    IRepository<T> Repository<T>() where T : class;
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpiration = null, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);
}

public interface IIntegrationEventPublisher
{
    Task PublishAsync<T>(T @event, CancellationToken ct = default) where T : IntegrationEvent;
}

// Resilient HTTP External Gateways
public interface IMerchandisingServiceClient
{
    Task<bool> OrderExistsAsync(Guid companyId, Guid orderId, CancellationToken ct = default);
    Task<bool> ColorSizeBreakdownExistsAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, CancellationToken ct = default);
}

public interface ICuttingServiceClient
{
    Task<int> GetCuttingQtyAsync(Guid companyId, Guid orderId, string sizeName, CancellationToken ct = default);
}

public interface IProductionServiceClient
{
    Task<int> GetSewingQtyAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, CancellationToken ct = default);
}

public interface IFinishingServiceClient
{
    Task<int> GetFinishingQtyAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, CancellationToken ct = default);
}

public interface IShipmentServiceClient
{
    Task NotifyFinalInspectionPassedAsync(Guid companyId, Guid orderId, CancellationToken ct = default);
}

public interface IImportExportServiceClient
{
    Task<ReportExportFile> ExportAsync(
        string title, 
        string format, 
        IReadOnlyList<string> columns, 
        IReadOnlyList<IReadOnlyList<string>> rows, 
        string authorizationHeader, 
        CancellationToken ct = default);
}
