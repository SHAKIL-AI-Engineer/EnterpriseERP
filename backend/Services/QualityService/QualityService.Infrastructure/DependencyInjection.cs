using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QualityService.Application;
using QualityService.Infrastructure.EventBus;
using QualityService.Infrastructure.ExternalServices;
using QualityService.Infrastructure.Persistence;
using QualityService.Infrastructure.Repositories;
using QualityService.Infrastructure.Services;

namespace QualityService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Database Isolation configuration
        if (config["Database:UseInMemory"] == "true")
        {
            var dbName = config["Database:InMemoryName"] ?? "QualityDb";
            services.AddDbContext<QualityDbContext>(opt => opt.UseInMemoryDatabase(dbName));
        }
        else
        {
            var connectionString = config.GetConnectionString("QualityDb")
                ?? config.GetConnectionString("DefaultConnection") 
                ?? "Server=localhost;Database=QualityServiceDB;User Id=sa;Password=123580;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true";
            services.AddDbContext<QualityDbContext>(opt => opt.UseSqlServer(connectionString));
        }

        services.AddScoped<IQualityDbContext>(sp => sp.GetRequiredService<QualityDbContext>());
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));

        // Distributed Resilient Redis Caching
        var redisConn = config.GetConnectionString("Redis") ?? "localhost:6379";
        services.AddStackExchangeRedisCache(opt => opt.Configuration = redisConn);
        services.AddScoped<IRedisCacheService, RedisCacheService>();

        // Resilient RabbitMQ Event Bus
        services.AddSingleton<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();
        services.AddHostedService<RabbitMqConsumerHostedService>();

        // Register HTTP Clients with unique names to avoid Platform Host DI clashing
        services.AddHttpClient("QualityMerchandising", client =>
        {
            client.BaseAddress = new Uri(config["Services:MerchandisingUrl"] ?? "http://localhost:5001");
        }).AddTypedClient<IMerchandisingServiceClient, MerchandisingServiceClient>();

        services.AddHttpClient("QualityCutting", client =>
        {
            client.BaseAddress = new Uri(config["Services:CuttingUrl"] ?? "http://localhost:5002");
        }).AddTypedClient<ICuttingServiceClient, CuttingServiceClient>();

        services.AddHttpClient("QualityProduction", client =>
        {
            client.BaseAddress = new Uri(config["Services:ProductionUrl"] ?? "http://localhost:5003");
        }).AddTypedClient<IProductionServiceClient, ProductionServiceClient>();

        services.AddHttpClient("QualityFinishing", client =>
        {
            client.BaseAddress = new Uri(config["Services:FinishingUrl"] ?? "http://localhost:5004");
        }).AddTypedClient<IFinishingServiceClient, FinishingServiceClient>();

        services.AddHttpClient("QualityShipment", client =>
        {
            client.BaseAddress = new Uri(config["Services:ShipmentUrl"] ?? "http://localhost:5005");
        }).AddTypedClient<IShipmentServiceClient, ShipmentServiceClient>();

        services.AddHttpClient("QualityImportExport", client =>
        {
            client.BaseAddress = new Uri(config["Services:ImportExportUrl"] ?? "http://localhost:8000");
        }).AddTypedClient<IImportExportServiceClient, ImportExportServiceClient>();

        return services;
    }
}
