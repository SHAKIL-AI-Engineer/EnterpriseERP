using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShipmentService.Application;
using ShipmentService.Infrastructure.Persistence;
using ShipmentService.Infrastructure.Repositories;

namespace ShipmentService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddShipmentInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ShipmentDbContext>(o => o.UseInMemoryDatabase("ShipmentService"));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddHttpClient<IMerchandisingShipmentClient, MerchandisingShipmentClient>(c =>
            c.BaseAddress = new Uri(configuration["Services:MerchandisingService"] ?? "http://localhost:5288"));
        return services;
    }
}
