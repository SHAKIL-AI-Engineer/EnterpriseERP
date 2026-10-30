using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace ShiftService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddShiftApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddAutoMapper(_ => { }, assembly);

        return services;
    }
}
