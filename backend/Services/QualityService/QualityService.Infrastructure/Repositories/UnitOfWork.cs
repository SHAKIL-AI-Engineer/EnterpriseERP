using QualityService.Application;
using QualityService.Infrastructure.Persistence;
using System.Collections;

namespace QualityService.Infrastructure.Repositories;

public sealed class UnitOfWork(QualityDbContext db) : IUnitOfWork
{
    private Hashtable? _repositories;

    public IRepository<T> Repository<T>() where T : class
    {
        _repositories ??= [];
        var type = typeof(T).Name;

        if (_repositories.ContainsKey(type))
        {
            return (IRepository<T>)_repositories[type]!;
        }

        var repositoryInstance = new EfRepository<T>(db);
        _repositories.Add(type, repositoryInstance);

        return repositoryInstance;
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);

    public void Dispose() => db.Dispose();
}
