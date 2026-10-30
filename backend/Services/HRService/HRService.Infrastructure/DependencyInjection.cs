using Erp.BuildingBlocks.ReportExport;
using HRService.Application.Employees;
using HRService.Application.Manpower;
using HRService.Infrastructure.Options;
using HRService.Infrastructure.Persistence;
using HRService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Caching.Memory;

namespace HRService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddHrInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<HrDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("HrDb"),
                sql =>
                {
                    sql.EnableRetryOnFailure();
                    sql.MigrationsAssembly(typeof(HrDbContext).Assembly.GetName().Name);
                })
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

        services.AddOptions<EmployeeImportOptions>()
            .Bind(configuration.GetSection(EmployeeImportOptions.SectionName));

        services.AddOptions<EmployeeImageOptions>()
            .Bind(configuration.GetSection(EmployeeImageOptions.SectionName));

        services.AddMemoryCache();
        services.AddSingleton<EmployeeExcelImportSessionStore>();
        services.AddScoped<IEmployeeExcelImportService, EmployeeExcelImportService>();

        services.AddScoped<IEmployeeReadService, EmployeeReadService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IEmployeeImageStorage, EmployeeImageStorage>();
        services.AddScoped<IEmployeeImageService, EmployeeImageService>();
        services.AddScoped<EmployeeOrganogramResolver>();
        services.AddScoped<EmployeeImportRowProcessor>();
        services.AddScoped<IEmployeeImportService, EmployeeImportService>();
        services.AddScoped<IManpowerRequirementService, ManpowerRequirementService>();
        services.AddReportExportClient(configuration, "hr");

        services.AddHttpClient<IHrNotificationClient, HrNotificationClient>("Hr.IHrNotificationClient", c =>
        {
            c.BaseAddress = new Uri(configuration["Services:NotificationService"] ?? "http://127.0.0.1:5047/");
        });

        return services;
    }
}
