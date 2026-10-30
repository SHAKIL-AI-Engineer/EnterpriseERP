using ShipmentService.Contracts;
using ShipmentService.Domain;

namespace ShipmentService.Application;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    IQueryable<T> Query();
    Task AddAsync(T entity, CancellationToken ct = default);
}

public interface IUnitOfWork
{
    IRepository<ShipmentReadiness> Readiness { get; }
    IRepository<ShipmentExecution> Executions { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public interface IMerchandisingShipmentClient
{
    Task<ShipmentPlanSnapshotDto?> GetPlanAsync(Guid companyId, Guid orderId, CancellationToken ct = default);
}
