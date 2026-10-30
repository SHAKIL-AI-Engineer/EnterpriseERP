using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SewingService.Application;
using SewingService.Infrastructure.EventBus;
using SewingService.Infrastructure.ExternalServices;
using SewingService.Infrastructure.Persistence;
using SewingService.Infrastructure.Repositories;
using SewingService.Infrastructure.Services;

namespace SewingService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddSewingInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        if (configuration.GetValue("Database:UseInMemory", true))
        {
            services.AddDbContext<SewingDbContext>(options =>
                options.UseInMemoryDatabase(configuration["Database:InMemoryName"] ?? "SewingService"));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("SewingDb") ?? configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<SewingDbContext>(options =>
                options.UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(SewingDbContext).Assembly.FullName)));
        }

        services.AddScoped<ISewingDbContext>(sp => sp.GetRequiredService<SewingDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddSingleton<IRedisCacheService, RedisCacheService>();
        services.AddScoped<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();
        services.AddHttpClient<IMerchandisingServiceClient, MerchandisingServiceClient>(c =>
            c.BaseAddress = new Uri(configuration["Services:MerchandisingService"] ?? "http://localhost:5288"));
        services.AddHttpClient<IReportExportClient, ReportExportClient>(c =>
            c.BaseAddress = new Uri(configuration["Services:ImportExportService"] ?? "http://localhost:8060"));
        services.AddHostedService<RabbitMqConsumerHostedService>();
        return services;
    }
}
