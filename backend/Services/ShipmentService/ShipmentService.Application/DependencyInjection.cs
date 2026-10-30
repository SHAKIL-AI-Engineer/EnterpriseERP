using Microsoft.Extensions.DependencyInjection;

namespace ShipmentService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddShipmentApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        services.AddAutoMapper(cfg => cfg.AddProfile<ShipmentMappingProfile>());
        return services;
    }
}
