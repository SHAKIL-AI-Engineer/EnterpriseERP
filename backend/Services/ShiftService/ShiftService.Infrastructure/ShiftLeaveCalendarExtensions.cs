using LeaveService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Infrastructure.Services;

namespace ShiftService.Infrastructure;

public static class ShiftLeaveCalendarExtensions
{
    public static IServiceCollection AddShiftLeaveCalendar(this IServiceCollection services, IConfiguration configuration)
    {
        var leaveCs = configuration.GetConnectionString("LeaveDb");
        if (!string.IsNullOrWhiteSpace(leaveCs))
        {
            services.AddDbContext<LeaveDbContext>(options =>
                options.UseSqlServer(leaveCs, sql => sql.EnableRetryOnFailure()));
            services.AddScoped<ILeaveCalendarProvider, LeaveDbCalendarProvider>();
        }
        else
        {
            services.AddScoped<ILeaveCalendarProvider, NoOpLeaveCalendarProvider>();
        }

        return services;
    }
}
