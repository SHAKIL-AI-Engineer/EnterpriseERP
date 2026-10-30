using System.Text.Json;
using MerchandisingService.Application;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace MerchandisingService.Infrastructure.Services;

public sealed class RedisCacheService : IRedisCacheService
{
    private readonly IDatabase? _database;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConfiguration configuration, ILogger<RedisCacheService> logger)
    {
        _logger = logger;
        var connectionString = configuration.GetConnectionString("Redis") ?? configuration["Redis:ConnectionString"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return;
        }

        try
        {
            _database = ConnectionMultiplexer.Connect(connectionString).GetDatabase();
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis is unavailable. MerchandisingService will run without distributed cache.");
        }
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (_database is null)
        {
            return default;
        }

        var value = await _database.StringGetAsync(key);
        return value.HasValue ? JsonSerializer.Deserialize<T>(value.ToString()) : default;
    }

    public Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        if (_database is null)
        {
            return Task.CompletedTask;
        }

        return _database.StringSetAsync(key, JsonSerializer.Serialize(value), expiration);
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        if (_database is null)
        {
            return Task.CompletedTask;
        }

        return _database.KeyDeleteAsync(key);
    }
}
