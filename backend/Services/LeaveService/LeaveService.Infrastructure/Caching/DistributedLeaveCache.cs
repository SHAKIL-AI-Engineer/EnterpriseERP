using System.Text.Json;
using LeaveService.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace LeaveService.Infrastructure.Caching;

public sealed class DistributedLeaveCache(IDistributedCache cache, ILogger<DistributedLeaveCache> logger) : ILeaveCache
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static readonly TimeSpan CacheOperationTimeout = TimeSpan.FromMilliseconds(750);

    public async Task<T?> GetOrCreateAsync<T>(string key, TimeSpan ttl, Func<CancellationToken, Task<T>> factory, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var existing = await WithTimeoutAsync(
                ct => cache.GetStringAsync(key, ct),
                cancellationToken);
            if (!string.IsNullOrEmpty(existing))
            {
                return JsonSerializer.Deserialize<T>(existing, JsonOptions);
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("Leave cache read timed out for {CacheKey}; loading from database.", key);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Leave cache read failed for {CacheKey}; loading from database.", key);
        }

        var created = await factory(cancellationToken);
        if (created is null)
        {
            return null;
        }

        try
        {
            await WithTimeoutAsync(
                ct => cache.SetStringAsync(
                    key,
                    JsonSerializer.Serialize(created, JsonOptions),
                    new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl },
                    ct),
                cancellationToken);
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("Leave cache write timed out for {CacheKey}; continuing without cache.", key);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Leave cache write failed for {CacheKey}; continuing without cache.", key);
        }

        return created;
    }

    private static async Task<string?> WithTimeoutAsync(
        Func<CancellationToken, Task<string?>> operation,
        CancellationToken cancellationToken)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(CacheOperationTimeout);
        return await operation(timeoutCts.Token);
    }

    private static async Task WithTimeoutAsync(
        Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(CacheOperationTimeout);
        await operation(timeoutCts.Token);
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default) =>
        // IDistributedCache has no prefix delete; no-op in default implementation (invalidate via versioned keys in production).
        Task.CompletedTask;
}
