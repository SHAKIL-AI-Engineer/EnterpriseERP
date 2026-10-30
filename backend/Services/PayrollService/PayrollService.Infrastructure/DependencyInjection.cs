using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Erp.BuildingBlocks.ReportExport;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PayrollService.Application;
using PayrollService.Infrastructure.EventBus;
using PayrollService.Infrastructure.ExternalServices;
using PayrollService.Infrastructure.Persistence;
using PayrollService.Infrastructure.Repositories;
using PayrollService.Infrastructure.Services;

namespace PayrollService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddPayrollInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        var connectionString =
            configuration.GetConnectionString("PayrollDb")
            ?? configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<PayrollDbContext>(options =>
            options.UseSqlServer(connectionString,
                b => b.MigrationsAssembly(typeof(PayrollDbContext).Assembly.FullName)));

        services.AddScoped<IPayrollDbContext>(sp => sp.GetRequiredService<PayrollDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddSingleton<IRedisCacheService, RedisCacheService>();
        services.AddScoped<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();
        services.AddScoped<ISalaryAdvanceService, SalaryAdvanceService>();
        services.AddScoped<ISalaryIncrementService, SalaryIncrementService>();
        services.AddScoped<IFinalSettlementService, FinalSettlementService>();

        void ConfigureServiceClient(HttpClient c, string? configuredUrl, string fallbackUrl) =>
            c.BaseAddress = new Uri(configuredUrl ?? fallbackUrl);

        services.AddTransient<ForwardAuthorizationHandler>();
        var useInProcessEmployeeClient = configuration.GetValue("Payroll:UseInProcessEmployeeClient", false);
        if (!useInProcessEmployeeClient)
        {
            services.AddHttpClient<IEmployeeServiceClient, EmployeeServiceClient>("Payroll.IEmployeeServiceClient", c =>
                    ConfigureServiceClient(c, configuration["Services:EmployeeService"] ?? configuration["Services:HR"], "http://localhost:5000"))
                .AddHttpMessageHandler<ForwardAuthorizationHandler>();
        }
        services.AddHttpClient<IAttendanceServiceClient, AttendanceServiceClient>("Payroll.IAttendanceServiceClient", c =>
                ConfigureServiceClient(c, configuration["Services:AttendanceService"], "http://localhost:5000"))
            .AddHttpMessageHandler<ForwardAuthorizationHandler>();
        services.AddHttpClient<ILeaveServiceClient, LeaveServiceClient>("Payroll.ILeaveServiceClient", c =>
                ConfigureServiceClient(c, configuration["Services:LeaveService"], "http://localhost:5000"))
            .AddHttpMessageHandler<ForwardAuthorizationHandler>();
        services.AddHttpClient<ICompanyServiceClient, CompanyServiceClient>("Payroll.ICompanyServiceClient", c =>
                ConfigureServiceClient(c, configuration["Services:CompanyService"], "http://localhost:5000"))
            .AddHttpMessageHandler<ForwardAuthorizationHandler>();
        services.AddHttpClient<INotificationServiceClient, NotificationServiceClient>("Payroll.INotificationServiceClient", c =>
                ConfigureServiceClient(c, configuration["Services:NotificationService"], "http://localhost:5000"))
            .AddHttpMessageHandler<ForwardAuthorizationHandler>();

        services.AddHostedService<RabbitMqConsumerHostedService>();

        services.AddReportExportClient(configuration, "payroll");

        return services;
    }
}
