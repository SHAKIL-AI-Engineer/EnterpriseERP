using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using MerchandisingService.Application.Common;

namespace MerchandisingService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddMerchandisingApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());
        services.AddScoped<IBomCalculationService, BomCalculationService>();
        services.AddScoped<ICostingCalculationService, CostingCalculationService>();
        services.AddScoped<ITnaGenerationService, TnaGenerationService>();
        return services;
    }
}
