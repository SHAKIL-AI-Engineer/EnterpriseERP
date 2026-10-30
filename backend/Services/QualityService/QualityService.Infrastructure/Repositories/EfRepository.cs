using Microsoft.EntityFrameworkCore;
using QualityService.Application;
using QualityService.Infrastructure.Persistence;

namespace QualityService.Infrastructure.Repositories;

public sealed class EfRepository<T>(QualityDbContext db) : IRepository<T> where T : class
{
    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Set<T>().FindAsync([id], ct);

    public async Task<IReadOnlyList<T>> ListAsync(CancellationToken ct = default) =>
        await db.Set<T>().AsNoTracking().ToListAsync(ct);

    public void Add(T entity) => db.Set<T>().Add(entity);

    public void Update(T entity) => db.Set<T>().Update(entity);

    public void Delete(T entity) => db.Set<T>().Remove(entity);
}
