using MerchandisingService.Application;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Infrastructure.Repositories;

public sealed class EfRepository<TEntity>(MerchandisingService.Infrastructure.Persistence.MerchandisingDbContext db) : IRepository<TEntity>
    where TEntity : class
{
    public IQueryable<TEntity> Query() => db.Set<TEntity>();

    public Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<TEntity>().FindAsync([id], cancellationToken).AsTask();

    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) =>
        await db.Set<TEntity>().AddAsync(entity, cancellationToken);

    public void Remove(TEntity entity) => db.Set<TEntity>().Remove(entity);
}
