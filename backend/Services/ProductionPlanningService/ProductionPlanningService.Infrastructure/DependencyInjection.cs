using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ProductionPlanningService.Application;
using ProductionPlanningService.Infrastructure.Persistence;
using ProductionPlanningService.Infrastructure.Repositories;

namespace ProductionPlanningService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddProductionPlanningInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var useInMemory = string.Equals(configuration["Database:UseInMemory"], "true", StringComparison.OrdinalIgnoreCase) || configuration["Database:UseInMemory"] is null;
        if (useInMemory)
        {
            services.AddDbContext<PlanningDbContext>(o => o.UseInMemoryDatabase("ProductionPlanning"));
        }
        else
        {
            var cs = configuration.GetConnectionString("PlanningDb");
            services.AddDbContext<PlanningDbContext>(o => o.UseSqlServer(cs, b => b.MigrationsAssembly(typeof(PlanningDbContext).Assembly.FullName)));
        }
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        return services;
    }
}
