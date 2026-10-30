using SecurityService.Application;
using SecurityService.Infrastructure.Persistence;

namespace SecurityService.Infrastructure.Repositories;

public sealed class UnitOfWork(SecurityDbContext db, IServiceProvider serviceProvider) : IUnitOfWork
{
    public IRepository<TEntity> Repository<TEntity>() where TEntity : class =>
        serviceProvider.GetService(typeof(IRepository<TEntity>)) as IRepository<TEntity>
        ?? new EfRepository<TEntity>(db);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
