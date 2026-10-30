using Microsoft.Extensions.Caching.Distributed;
using QualityService.Application;
using System.Text.Json;

namespace QualityService.Infrastructure.Services;

public sealed class RedisCacheService(IDistributedCache cache) : IRedisCacheService
{
    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        try
        {
            var value = await cache.GetStringAsync(key, ct);
            return value is not null ? JsonSerializer.Deserialize<T>(value) : default;
        }
        catch
        {
            // Resilient Fallback
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpiration = null, CancellationToken ct = default)
    {
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = absoluteExpiration ?? TimeSpan.FromMinutes(20)
            };
            var serialized = JsonSerializer.Serialize(value);
            await cache.SetStringAsync(key, serialized, options, ct);
        }
        catch
        {
            // Resilient Fallback
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        try
        {
            await cache.RemoveAsync(key, ct);
        }
        catch
        {
            // Resilient Fallback
        }
    }
}
