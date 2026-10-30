using AccountsService.Application.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace AccountsService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddAccountsApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());
        services.AddScoped<IVoucherPostingService, VoucherPostingService>();
        services.AddScoped<IReportService, ReportService>();
        return services;
    }
}
