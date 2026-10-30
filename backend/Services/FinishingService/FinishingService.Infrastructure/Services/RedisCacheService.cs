using System.Text.Json;
using FinishingService.Application;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FinishingService.Infrastructure.Services;

public sealed class RedisCacheService : IRedisCacheService
{
    private readonly IDatabase? _database;

    public RedisCacheService(IConfiguration configuration, ILogger<RedisCacheService> logger)
    {
        var connectionString = configuration.GetConnectionString("Redis") ?? configuration["Redis:ConnectionString"];
        if (string.IsNullOrWhiteSpace(connectionString)) return;
        try
        {
            _database = ConnectionMultiplexer.Connect(connectionString).GetDatabase();
        }
        catch (RedisConnectionException ex)
        {
            logger.LogWarning(ex, "Redis is unavailable. FinishingService will run without distributed cache.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to connect to Redis. FinishingService will run without distributed cache.");
        }
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (_database is null) return default;
        try
        {
            var value = await _database.StringGetAsync(key);
            return value.HasValue ? JsonSerializer.Deserialize<T>(value.ToString()) : default;
        }
        catch (Exception)
        {
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        if (_database is null) return;
        try
        {
            await _database.StringSetAsync(key, JsonSerializer.Serialize(value), expiration);
        }
        catch (Exception)
        {
            // Fail silently to ensure endpoint stays functional if cache fails
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        if (_database is null) return;
        try
        {
            await _database.KeyDeleteAsync(key);
        }
        catch (Exception)
        {
            // Fail silently
        }
    }
}
