using SewingService.Application;
using SewingService.Infrastructure.Persistence;

namespace SewingService.Infrastructure.Repositories;

public sealed class EfRepository<TEntity>(SewingDbContext db) : IRepository<TEntity> where TEntity : class
{
    public IQueryable<TEntity> Query() => db.Set<TEntity>();
    public Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => db.Set<TEntity>().FindAsync([id], cancellationToken).AsTask();
    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) => await db.Set<TEntity>().AddAsync(entity, cancellationToken);
    public void Update(TEntity entity) => db.Set<TEntity>().Update(entity);
    public void Remove(TEntity entity) => db.Set<TEntity>().Remove(entity);
}
