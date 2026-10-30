using CuttingService.Application;
using CuttingService.Infrastructure.EventBus;
using CuttingService.Infrastructure.ExternalServices;
using CuttingService.Infrastructure.Persistence;
using CuttingService.Infrastructure.Repositories;
using CuttingService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CuttingService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddCuttingInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        if (configuration.GetValue("Database:UseInMemory", false))
        {
            services.AddDbContext<CuttingDbContext>(options => options.UseInMemoryDatabase(configuration["Database:InMemoryName"] ?? "CuttingService"));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("CuttingDb") ?? configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<CuttingDbContext>(options => options.UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(CuttingDbContext).Assembly.FullName)));
        }

        services.AddScoped<ICuttingDbContext>(sp => sp.GetRequiredService<CuttingDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddSingleton<IRedisCacheService, RedisCacheService>();
        services.AddScoped<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();
        services.AddHttpClient<IMerchandisingServiceClient, MerchandisingServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:MerchandisingService"] ?? "http://localhost:5288"));
        services.AddHttpClient<IInventoryServiceClient, InventoryServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:InventoryService"] ?? "http://127.0.0.1:5041"));
        services.AddHttpClient<IProductionServiceClient, ProductionServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:ProductionService"] ?? "http://localhost:5130"));
        services.AddHttpClient<IReportExportClient, ReportExportClient>(c => c.BaseAddress = new Uri(configuration["Services:ImportExportService"] ?? "http://localhost:8060"));
        services.AddHostedService<RabbitMqConsumerHostedService>();
        return services;
    }
}
