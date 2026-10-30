using ProcurementService.Application;
using ProcurementService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ProcurementService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddProcurementInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var useInMemory = configuration.GetValue("Database:UseInMemory", false);
        if (useInMemory)
        {
            services.AddDbContext<ProcurementDbContext>(o => o.UseInMemoryDatabase(configuration["Database:InMemoryName"] ?? "ProcurementService"));
        }
        else
        {
            var cs = configuration.GetConnectionString("ProcurementDb") ?? configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<ProcurementDbContext>(o => o.UseSqlServer(cs, b => b.MigrationsAssembly(typeof(ProcurementDbContext).Assembly.FullName)));
        }

        services.AddScoped<IProcurementDbContext>(sp => sp.GetRequiredService<ProcurementDbContext>());
        return services;
    }
}
