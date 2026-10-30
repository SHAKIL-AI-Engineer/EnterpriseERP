using Erp.BuildingBlocks.EventBus;
using Erp.BuildingBlocks.ReportExport;
using LeaveService.Application.Common.Interfaces;
using LeaveService.Infrastructure.Caching;
using LeaveService.Infrastructure.External;
using LeaveService.Infrastructure.Messaging;
using LeaveService.Infrastructure.Persistence;
using LeaveService.Infrastructure.Repositories;
using LeaveService.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LeaveService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddLeaveInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var cs =
            configuration.GetConnectionString("LeaveDb")
            ?? configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<LeaveDbContext>(options =>
            options.UseSqlServer(cs, b => b.MigrationsAssembly(typeof(LeaveDbContext).Assembly.FullName)));

        services.AddScoped<ILeaveUnitOfWork, LeaveUnitOfWork>();
        services.AddScoped<ILeaveDayCalculator, LeaveDayCalculatorService>();
        services.AddScoped<ILeaveBalanceService, LeaveBalanceService>();
        services.AddScoped<ILeaveAuditService, LeaveAuditService>();
        services.AddScoped<IPayrollGate, PayrollGateService>();

        // Leave reference-data cache: in-process by default (fast, no Redis dependency).
        // Set Leave:UseRedisCache=true only when Redis is running and shared cache is required.
        services.AddMemoryCache();
        var useRedisCache = configuration.GetValue("Leave:UseRedisCache", false);
        var redis = configuration.GetConnectionString("Redis");
        if (useRedisCache && !string.IsNullOrWhiteSpace(redis))
        {
            var redisConfig = redis.Contains("abortConnect", StringComparison.OrdinalIgnoreCase)
                ? redis
                : $"{redis.TrimEnd(',')},abortConnect=false,connectTimeout=1000,syncTimeout=1000";
            services.AddStackExchangeRedisCache(o => o.Configuration = redisConfig);
            services.AddSingleton<ILeaveCache, DistributedLeaveCache>();
        }
        else
        {
            services.AddSingleton<ILeaveCache, MemoryLeaveCache>();
        }

        services.Configure<RabbitMqPublisherOptions>(configuration.GetSection("RabbitMQ"));
        services.AddSingleton<IIntegrationMessagePublisher, RabbitMqJsonPublisher>();

        services.AddHttpContextAccessor();
        services.AddTransient<ForwardAuthorizationHandler>();

        services.Configure<EmployeeServiceClientOptions>(configuration.GetSection("Services:Hr"));
        services.AddHttpClient<IEmployeeServiceClient, EmployeeServiceClient>("Leave.IEmployeeServiceClient")
            .AddHttpMessageHandler<ForwardAuthorizationHandler>();

        services.Configure<AttendanceServiceClientOptions>(configuration.GetSection("Services:Attendance"));
        services.AddHttpClient<IAttendanceServiceClient, AttendanceServiceClient>("Leave.IAttendanceServiceClient");

        services.Configure<PayrollServiceClientOptions>(configuration.GetSection("Services:Payroll"));
        services.AddHttpClient<IPayrollServiceClient, PayrollServiceClient>("Leave.IPayrollServiceClient");

        services.AddHttpClient<INotificationServiceClient, NotificationServiceClient>("Leave.INotificationServiceClient", c =>
        {
            c.BaseAddress = new Uri(configuration["Services:NotificationService"] ?? "http://127.0.0.1:5047/");
        }).AddHttpMessageHandler<ForwardAuthorizationHandler>();

        services.AddHostedService<LeaveIntegrationConsumer>();

        services.AddReportExportClient(configuration, "leave");

        return services;
    }
}
