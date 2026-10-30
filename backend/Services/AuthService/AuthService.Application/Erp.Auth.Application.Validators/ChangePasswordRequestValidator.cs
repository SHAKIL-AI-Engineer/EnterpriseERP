using AuthService.Contracts.Auth;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
	public ChangePasswordRequestValidator()
	{
		RuleFor(x => x.CurrentPassword).NotEmpty();
		RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(10);
		RuleFor(x => x.ConfirmPassword)
			.Equal(x => x.NewPassword)
			.WithMessage("New password and confirmation must match.");
	}
}
