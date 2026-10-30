using FinishingService.Application.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace FinishingService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddFinishingApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());
        services.AddScoped<IFinishingBalanceService, FinishingBalanceService>();
        return services;
    }
}
