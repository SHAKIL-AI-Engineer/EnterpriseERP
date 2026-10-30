using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using SecurityService.Application.Services;

namespace SecurityService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddSecurityApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();
        services.AddAutoMapper(_ => { }, assembly);
        services.AddValidatorsFromAssembly(assembly);
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        services.AddScoped<IVisitorEntryService, SecurityOperationsService>();
        services.AddScoped<IEmployeeOutPassService, SecurityOperationsService>();
        services.AddScoped<IVehicleEntryService, SecurityOperationsService>();
        services.AddScoped<IGatePassService, SecurityOperationsService>();
        services.AddScoped<IChalanService, SecurityOperationsService>();
        services.AddScoped<IBillEntryService, SecurityOperationsService>();
        services.AddScoped<ISecurityCheckService, SecurityOperationsService>();
        services.AddScoped<IReportDataBuilderService, ReportDataBuilderService>();
        return services;
    }
}
