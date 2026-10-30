using Microsoft.EntityFrameworkCore;
using ProductionPlanningService.Application;
using ProductionPlanningService.Domain;
using ProductionPlanningService.Infrastructure.Persistence;

namespace ProductionPlanningService.Infrastructure.Repositories;

public sealed class EfRepository<T>(PlanningDbContext db) : IRepository<T> where T : class
{
    public IQueryable<T> Query() => db.Set<T>();
    public Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) => db.Set<T>().FindAsync([id], ct).AsTask();
    public async Task AddAsync(T entity, CancellationToken ct = default) => await db.Set<T>().AddAsync(entity, ct);
    public void Remove(T entity) => db.Set<T>().Remove(entity);
}

public sealed class UnitOfWork(PlanningDbContext db) : IUnitOfWork
{
    public IRepository<LineCapacityPlan> LinePlans { get; } = new EfRepository<LineCapacityPlan>(db);
    public IRepository<PlanningBalance> Balances { get; } = new EfRepository<PlanningBalance>(db);
    public Task<int> SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
