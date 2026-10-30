using PayrollService.Infrastructure.Persistence;

namespace PayrollService.Infrastructure.Repositories;

public sealed class EfRepository<TEntity>(PayrollDbContext db) : IRepository<TEntity> where TEntity : class
{
    public IQueryable<TEntity> Query() => db.Set<TEntity>();
    public void Add(TEntity entity) => db.Set<TEntity>().Add(entity);
    public void Remove(TEntity entity) => db.Set<TEntity>().Remove(entity);
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
