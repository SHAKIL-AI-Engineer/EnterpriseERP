using InventoryService.Application;
using InventoryService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace InventoryService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInventoryInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var useInMemory = configuration.GetValue("Database:UseInMemory", false);
        if (useInMemory)
        {
            services.AddDbContext<InventoryDbContext>(o => o.UseInMemoryDatabase(configuration["Database:InMemoryName"] ?? "InventoryService"));
        }
        else
        {
            var cs = configuration.GetConnectionString("InventoryDb") ?? configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<InventoryDbContext>(o => o.UseSqlServer(cs, b => b.MigrationsAssembly(typeof(InventoryDbContext).Assembly.FullName)));
        }

        services.AddScoped<IInventoryDbContext>(sp => sp.GetRequiredService<InventoryDbContext>());
        return services;
    }
}
