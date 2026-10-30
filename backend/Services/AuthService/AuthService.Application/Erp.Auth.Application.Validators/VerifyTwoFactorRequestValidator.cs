using AuthService.Contracts.Auth;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class VerifyTwoFactorRequestValidator : AbstractValidator<VerifyTwoFactorRequest>
{
	public VerifyTwoFactorRequestValidator()
	{
		RuleFor((VerifyTwoFactorRequest x) => x.Code).NotEmpty().MinimumLength(4).MaximumLength(32);
	}
}
