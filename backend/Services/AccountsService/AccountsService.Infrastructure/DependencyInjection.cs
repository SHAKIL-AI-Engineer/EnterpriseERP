using AccountsService.Application;
using AccountsService.Infrastructure.EventBus;
using AccountsService.Infrastructure.ExternalServices;
using AccountsService.Infrastructure.Persistence;
using AccountsService.Infrastructure.Repositories;
using AccountsService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AccountsService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddAccountsInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        if (configuration.GetValue("Database:UseInMemory", false))
        {
            services.AddDbContext<AccountsDbContext>(options => options.UseInMemoryDatabase(configuration["Database:InMemoryName"] ?? "AccountsService"));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("AccountsDb") ?? configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<AccountsDbContext>(options => options.UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(AccountsDbContext).Assembly.FullName)));
        }

        services.AddScoped<IAccountsDbContext>(sp => sp.GetRequiredService<AccountsDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddSingleton<IRedisCacheService, RedisCacheService>();
        services.AddScoped<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();
        services.AddHttpClient<ICompanyServiceClient, CompanyServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:CompanyService"] ?? "http://localhost:5104"));
        services.AddHttpClient<IReportExportClient, ReportExportClient>(c => c.BaseAddress = new Uri(configuration["Services:ImportExportService"] ?? "http://localhost:5150"));
        services.AddHostedService<RabbitMqConsumerHostedService>();
        return services;
    }
}
