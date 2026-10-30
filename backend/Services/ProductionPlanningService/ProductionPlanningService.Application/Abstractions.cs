using ProductionPlanningService.Domain;

namespace ProductionPlanningService.Application;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    IQueryable<T> Query();
    Task AddAsync(T entity, CancellationToken ct = default);
    void Remove(T entity);
}

public interface IUnitOfWork
{
    IRepository<LineCapacityPlan> LinePlans { get; }
    IRepository<PlanningBalance> Balances { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
