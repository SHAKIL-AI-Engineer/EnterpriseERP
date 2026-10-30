using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using PayrollService.Application.Behaviors;

namespace PayrollService.Application;

public static class PayrollApplication
{
    public static IServiceCollection AddPayrollApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(PayrollApplication).Assembly));
        services.AddValidatorsFromAssembly(typeof(PayrollApplication).Assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddScoped<IOvertimeCalculationService, OvertimeCalculationService>();
        services.AddScoped<IBonusCalculationService, BonusCalculationService>();
        services.AddScoped<IPayrollCalculationService, PayrollCalculationService>();
        services.AddScoped<ISalaryStructureCalculator, SalaryStructureCalculator>();
        services.AddScoped<IPolicyResolver, PolicyResolver>();
        return services;
    }
}
