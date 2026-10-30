using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SecurityService.Application;
using SecurityService.Infrastructure.EventBus;
using SecurityService.Infrastructure.ExternalServices;
using SecurityService.Infrastructure.Persistence;
using SecurityService.Infrastructure.Repositories;
using SecurityService.Infrastructure.Services;

namespace SecurityService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddSecurityInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        if (configuration.GetValue("Database:UseInMemory", false) || configuration.GetValue("UseInMemoryDatabase", false))
        {
            services.AddDbContext<SecurityDbContext>(options => options.UseInMemoryDatabase(configuration["Database:InMemoryName"] ?? "SecurityService"));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("SecurityDb") ?? configuration.GetConnectionString("DefaultConnection")
                ?? "Server=localhost;Database=SecurityServiceDB;User Id=sa;Password=123580;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true";
            services.AddDbContext<SecurityDbContext>(options => options.UseSqlServer(connectionString, sql => sql.MigrationsAssembly(typeof(SecurityDbContext).Assembly.FullName)));
        }

        services.AddScoped<ISecurityDbContext>(sp => sp.GetRequiredService<SecurityDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        var redis = configuration.GetConnectionString("Redis") ?? configuration["Redis:ConnectionString"] ?? "localhost:6379";
        services.AddStackExchangeRedisCache(o => o.Configuration = redis);
        services.AddSingleton<IRedisCacheService, RedisCacheService>();
        services.AddSingleton<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();
        services.AddHostedService<RabbitMqConsumerHostedService>();

        services.AddHttpClient<IEmployeeServiceClient, EmployeeServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:EmployeeService"] ?? "http://localhost:5101"));
        services.AddHttpClient<IInventoryServiceClient, InventoryServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:InventoryService"] ?? "http://localhost:5107"));
        services.AddHttpClient<IProcurementServiceClient, ProcurementServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:ProcurementService"] ?? "http://localhost:5110"));
        services.AddHttpClient<IMerchandisingServiceClient, MerchandisingServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:MerchandisingService"] ?? "http://localhost:5109"));
        services.AddHttpClient<IAccountsServiceClient, AccountsServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:AccountsService"] ?? "http://localhost:5112"));
        services.AddHttpClient<IImportExportServiceClient, ImportExportServiceClient>(c => c.BaseAddress = new Uri(configuration["Services:ImportExportService"] ?? "http://localhost:5150"));
        return services;
    }
}
