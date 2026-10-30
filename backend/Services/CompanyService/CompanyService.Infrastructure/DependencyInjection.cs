using CompanyService.Application.Companies;
using CompanyService.Application.Addresses;
using CompanyService.Application.Organogram;
using CompanyService.Infrastructure.Persistence;
using CompanyService.Infrastructure.Services;
using CompanyService.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CompanyService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddCompanyInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<CompanyDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("CompanyDb"),
                sql =>
                {
                    sql.EnableRetryOnFailure();
                    sql.MigrationsAssembly(typeof(CompanyDbContext).Assembly.GetName().Name);
                }));

        services.AddScoped<ICompanyReadService, CompanyReadService>();
        services.AddScoped<ICompanyService, Services.CompanyService>();
        services.AddScoped<ICompanyFileStorage, CompanyFileStorage>();
        services.AddScoped<IAddressService, AddressService>();
        services.AddScoped<IOrganogramService, OrganogramService>();
        
        return services;
    }
}
