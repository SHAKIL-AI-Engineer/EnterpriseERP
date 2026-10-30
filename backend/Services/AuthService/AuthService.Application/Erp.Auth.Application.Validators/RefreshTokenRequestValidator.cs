using AuthService.Contracts.Auth;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
	public RefreshTokenRequestValidator()
	{
		RuleFor((RefreshTokenRequest x) => x.RefreshToken).NotEmpty().MaximumLength(2048);
	}
}
