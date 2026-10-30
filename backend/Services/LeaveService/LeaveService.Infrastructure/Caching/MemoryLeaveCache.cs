using LeaveService.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace LeaveService.Infrastructure.Caching;

/// <summary>
/// In-process cache for leave reference data (types, policies, holidays).
/// Avoids blocking on unreachable Redis during local development.
/// </summary>
public sealed class MemoryLeaveCache(IMemoryCache memory) : ILeaveCache
{
    public async Task<T?> GetOrCreateAsync<T>(
        string key,
        TimeSpan ttl,
        Func<CancellationToken, Task<T>> factory,
        CancellationToken cancellationToken = default)
        where T : class
    {
        if (memory.TryGetValue(key, out T? cached) && cached is not null)
        {
            return cached;
        }

        var created = await factory(cancellationToken);
        if (created is null)
        {
            return null;
        }

        memory.Set(key, created, ttl);
        return created;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
