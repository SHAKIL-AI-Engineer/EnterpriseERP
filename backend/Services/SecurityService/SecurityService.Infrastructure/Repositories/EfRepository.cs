using Microsoft.EntityFrameworkCore;
using SecurityService.Application;
using SecurityService.Infrastructure.Persistence;

namespace SecurityService.Infrastructure.Repositories;

public sealed class EfRepository<TEntity>(SecurityDbContext db) : IRepository<TEntity> where TEntity : class
{
    public IQueryable<TEntity> Query() => db.Set<TEntity>();
    public Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => db.Set<TEntity>().FindAsync([id], cancellationToken).AsTask();
    public Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) => db.Set<TEntity>().AddAsync(entity, cancellationToken).AsTask();
    public void Remove(TEntity entity) => db.Set<TEntity>().Remove(entity);
}
