using FinishingService.Application;
using FinishingService.Infrastructure.EventBus;
using FinishingService.Infrastructure.ExternalServices;
using FinishingService.Infrastructure.Persistence;
using FinishingService.Infrastructure.Repositories;
using FinishingService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FinishingService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddFinishingInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        if (configuration.GetValue("Database:UseInMemory", false))
        {
            services.AddDbContext<FinishingDbContext>(options => 
                options.UseInMemoryDatabase(configuration["Database:InMemoryName"] ?? "FinishingService"));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("FinishingDb") ?? configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<FinishingDbContext>(options => 
                options.UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(FinishingDbContext).Assembly.FullName)));
        }

        services.AddScoped<IFinishingDbContext>(sp => sp.GetRequiredService<FinishingDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        services.AddSingleton<IRedisCacheService, RedisCacheService>();
        services.AddScoped<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();

        services.AddHttpClient("FinishingMerchandising", c => 
            c.BaseAddress = new Uri(configuration["Services:MerchandisingService"] ?? "http://localhost:5288"))
            .AddTypedClient<IMerchandisingServiceClient, MerchandisingServiceClient>();
        
        services.AddHttpClient("FinishingInventory", c => 
            c.BaseAddress = new Uri(configuration["Services:InventoryService"] ?? "http://localhost:5110"))
            .AddTypedClient<IInventoryServiceClient, InventoryServiceClient>();
        
        services.AddHttpClient("FinishingProduction", c => 
            c.BaseAddress = new Uri(configuration["Services:ProductionService"] ?? "http://localhost:5130"))
            .AddTypedClient<IProductionServiceClient, ProductionServiceClient>();

        services.AddHttpClient("FinishingShipment", c => 
            c.BaseAddress = new Uri(configuration["Services:ShipmentService"] ?? "http://localhost:5140"))
            .AddTypedClient<IShipmentServiceClient, ShipmentServiceClient>();

        services.AddHttpClient("FinishingReportExport", c => 
            c.BaseAddress = new Uri(configuration["Services:ImportExportService"] ?? "http://localhost:8060"))
            .AddTypedClient<IReportExportClient, ReportExportClient>();

        services.AddHostedService<RabbitMqConsumerHostedService>();

        return services;
    }
}
