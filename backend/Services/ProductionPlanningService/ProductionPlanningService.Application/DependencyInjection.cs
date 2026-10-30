using Microsoft.Extensions.DependencyInjection;

namespace ProductionPlanningService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddProductionPlanningApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        services.AddAutoMapper(cfg => cfg.AddProfile<PlanningMappingProfile>());
        return services;
    }
}
