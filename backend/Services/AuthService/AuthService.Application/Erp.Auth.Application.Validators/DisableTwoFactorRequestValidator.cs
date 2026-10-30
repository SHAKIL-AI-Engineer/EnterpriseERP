using AuthService.Contracts.Auth;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class DisableTwoFactorRequestValidator : AbstractValidator<DisableTwoFactorRequest>
{
	public DisableTwoFactorRequestValidator()
	{
		RuleFor((DisableTwoFactorRequest x) => x.Password).NotEmpty();
		RuleFor((DisableTwoFactorRequest x) => x.Code).NotEmpty().MinimumLength(4).MaximumLength(32);
	}
}
