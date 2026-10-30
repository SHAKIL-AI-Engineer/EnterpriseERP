using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Erp.BuildingBlocks.CommonSecurity;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddEnterpriseTenantSecurity(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<TenantOptions>(configuration.GetSection(TenantOptions.SectionName));
        services.AddScoped<ITenantContext, TenantContext>();
        return services;
    }

    public static IApplicationBuilder UseEnterpriseTenantSecurity(this IApplicationBuilder app)
    {
        app.UseMiddleware<TenantMiddleware>();
        return app;
    }
}
