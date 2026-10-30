using System.Reflection;
using FluentValidation;
using LeaveService.Application.Common.Behaviors;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace LeaveService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddLeaveApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddAutoMapper(_ => { }, Assembly.GetExecutingAssembly());
        return services;
    }
}
