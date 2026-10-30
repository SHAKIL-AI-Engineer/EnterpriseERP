using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShiftService.Infrastructure.Persistence;
using ShiftService.Infrastructure.Services;
using ShiftService.Application.Shifts;
using ShiftService.Application.Common.Interfaces;

namespace ShiftService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddShiftInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var shiftCs =
            configuration.GetConnectionString("ShiftDb")
            ?? configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<ShiftDbContext>(options =>
            options.UseSqlServer(
                shiftCs,
                sql =>
                {
                    sql.EnableRetryOnFailure();
                    sql.MigrationsAssembly(typeof(ShiftDbContext).Assembly.GetName().Name);
                }));

        services.AddScoped<IShiftDbContext>(provider => provider.GetRequiredService<ShiftDbContext>());
        services.AddScoped<IShiftSelectionService, ShiftSelectionService>();
        services.AddScoped<IShiftEvaluationService, ShiftEvaluationService>();

        return services;
    }
}
