using AuthService.Application.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Application;

public static class DependencyInjection
{
	public static IServiceCollection AddAuthApplication(this IServiceCollection services)
	{
		services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
		return services;
	}
}
