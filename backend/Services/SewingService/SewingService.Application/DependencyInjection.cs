using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SewingService.Application.Services;

namespace SewingService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddSewingApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());
        services.AddScoped<ISewingBalanceService, SewingBalanceService>();
        return services;
    }
}
