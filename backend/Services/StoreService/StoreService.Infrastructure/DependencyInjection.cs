using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StoreService.Application;
using StoreService.Infrastructure.Persistence;
using StoreService.Infrastructure.Services;

namespace StoreService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddStoreInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var useInMemory = configuration.GetValue("Database:UseInMemory", false);
        if (useInMemory)
        {
            services.AddDbContext<StoreDbContext>(o => o.UseInMemoryDatabase(configuration["Database:InMemoryName"] ?? "StoreService"));
        }
        else
        {
            var cs = configuration.GetConnectionString("StoreDb") ?? configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<StoreDbContext>(o => o.UseSqlServer(cs, b => b.MigrationsAssembly(typeof(StoreDbContext).Assembly.FullName)));
        }

        services.AddScoped<IStoreDbContext>(sp => sp.GetRequiredService<StoreDbContext>());

        var inventoryBase = configuration["InventorySync:BaseUrl"] ?? "http://127.0.0.1:5041/";
        services.AddHttpClient<IInventorySyncClient, InventorySyncClient>(client =>
        {
            client.BaseAddress = new Uri(inventoryBase);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        return services;
    }
}
