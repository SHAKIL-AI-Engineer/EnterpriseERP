using FinishingService.Application;
using FinishingService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinishingService.Infrastructure.Repositories;

public sealed class EfRepository<TEntity>(FinishingDbContext db) : IRepository<TEntity> where TEntity : class
{
    public IQueryable<TEntity> Query() => db.Set<TEntity>().AsQueryable();

    public async Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await db.Set<TEntity>().FindAsync([id], cancellationToken);

    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) =>
        await db.Set<TEntity>().AddAsync(entity, cancellationToken);

    public void Remove(TEntity entity) => db.Set<TEntity>().Remove(entity);
}
