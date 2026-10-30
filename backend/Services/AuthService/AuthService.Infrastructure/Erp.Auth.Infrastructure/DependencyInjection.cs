using System;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Abstractions.CompanyAccess;
using AuthService.Application.Abstractions.Permissions;
using AuthService.Application.Abstractions.Roles;
using AuthService.Application.Abstractions.Users;
using AuthService.Contracts.CompanyAccess;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Options;
using AuthService.Infrastructure.Persistence;
using AuthService.Infrastructure.Repositories;
using AuthService.Infrastructure.Security;
using AuthService.Infrastructure.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Infrastructure;

public static class DependencyInjection
{
	public static IServiceCollection AddAuthInfrastructure(this IServiceCollection services, IConfiguration configuration)
	{
		services.AddDataProtection();
        services.AddHttpContextAccessor();
		services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
		services.Configure<AuthFeatureOptions>(configuration.GetSection("Auth"));
		services.Configure<UserProfileOptions>(configuration.GetSection(UserProfileOptions.SectionName));
		services.Configure<TwoFactorOptions>(configuration.GetSection(TwoFactorOptions.SectionName));
		services.AddDbContext<AuthDbContext>(delegate(DbContextOptionsBuilder options)
		{
			options.UseSqlServer(configuration.GetConnectionString("AuthDb"), delegate(SqlServerDbContextOptionsBuilder sql)
			{
				sql.EnableRetryOnFailure();
				sql.MigrationsAssembly(typeof(AuthDbContext).Assembly.GetName().Name);
			});
		});
		services.AddIdentityCore<AppUser>(delegate(IdentityOptions options)
		{
			options.User.RequireUniqueEmail = true;
			options.Password.RequiredLength = 10;
			options.Password.RequireDigit = true;
			options.Password.RequireLowercase = true;
			options.Password.RequireUppercase = true;
			options.Password.RequireNonAlphanumeric = false;
			options.Lockout.AllowedForNewUsers = true;
			options.Lockout.MaxFailedAccessAttempts = 5;
			options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15.0);
		}).AddRoles<AppRole>().AddEntityFrameworkStores<AuthDbContext>().AddDefaultTokenProviders();
		services.AddScoped<IJwtTokenIssuer, JwtTokenIssuer>();
		services.AddScoped<IPendingTwoFactorLoginTokenIssuer, PendingTwoFactorLoginTokenIssuer>();
		services.AddScoped<ITwoFactorAuthenticatorService, TwoFactorAuthenticatorService>();
		services.AddScoped<IUserCompanyAccessRepository, UserCompanyAccessRepository>();
		services.AddScoped<ICompanyAccessAdminService, CompanyAccessAdminService>();
		services.AddScoped<IUserAdminService, UserAdminService>();
		services.AddScoped<IRoleAdminService, RoleAdminService>();
		services.AddScoped<IPermissionQueryService, PermissionQueryService>();
		services.AddScoped<IUserProfilePictureStorage, UserProfilePictureStorage>();
		services.AddScoped<IAuthService, IdentityAuthService>();
		return services;
	}
}
