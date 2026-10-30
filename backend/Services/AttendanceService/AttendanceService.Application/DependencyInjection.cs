using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace AttendanceService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddAttendanceApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
        return services;
    }
}
