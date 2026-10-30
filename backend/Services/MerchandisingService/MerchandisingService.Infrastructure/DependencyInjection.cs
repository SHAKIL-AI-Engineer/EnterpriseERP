using MerchandisingService.Application;
using MerchandisingService.Infrastructure.EventBus;
using MerchandisingService.Infrastructure.ExternalServices;
using MerchandisingService.Infrastructure.Persistence;
using MerchandisingService.Infrastructure.Repositories;
using MerchandisingService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MerchandisingService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddMerchandisingInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var useInMemory = configuration.GetValue("Database:UseInMemory", false);
        if (useInMemory)
        {
            services.AddDbContext<MerchandisingDbContext>(options => options.UseInMemoryDatabase(configuration["Database:InMemoryName"] ?? "MerchandisingService"));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("MerchandisingDb") ?? configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<MerchandisingDbContext>(options =>
                options.UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(MerchandisingDbContext).Assembly.FullName)));
        }

        services.AddScoped<IMerchandisingDbContext>(sp => sp.GetRequiredService<MerchandisingDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddSingleton<IRedisCacheService, RedisCacheService>();
        services.AddScoped<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();

        services.AddHttpClient<ICompanyServiceClient, CompanyServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:CompanyService"] ?? "http://localhost:5104"));
        services.AddHttpClient<IInventoryServiceClient, InventoryServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:InventoryService"] ?? "http://localhost:5110"));
        services.AddHttpClient<IProcurementServiceClient, ProcurementServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:ProcurementService"] ?? "http://localhost:5120"));
        services.AddHttpClient<IProductionServiceClient, ProductionServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:ProductionService"] ?? "http://localhost:5130"));
        services.AddHttpClient<IShipmentServiceClient, ShipmentServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:ShipmentService"] ?? "http://localhost:5140"));

        services.AddHostedService<RabbitMqConsumerHostedService>();
        return services;
    }
}
