using Microsoft.Extensions.DependencyInjection;

namespace StoreService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddStoreApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        return services;
    }
}
