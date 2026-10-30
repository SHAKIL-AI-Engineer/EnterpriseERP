using AuthService.Contracts.Auth;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
	public LoginRequestValidator()
	{
		RuleFor((LoginRequest x) => x.Username).NotEmpty().MaximumLength(128);
		RuleFor((LoginRequest x) => x.Password).NotEmpty().MaximumLength(512);
	}
}
