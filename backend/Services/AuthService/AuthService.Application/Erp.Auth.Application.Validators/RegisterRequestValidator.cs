using AuthService.Contracts.Auth;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
	public RegisterRequestValidator()
	{
		RuleFor((RegisterRequest x) => x.Username).NotEmpty().MinimumLength(3).MaximumLength(128);
		RuleFor((RegisterRequest x) => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
		RuleFor((RegisterRequest x) => x.Password).NotEmpty().MaximumLength(256).MinimumLength(10)
			.Matches("[0-9]")
			.WithMessage("Password must contain at least one digit.")
			.Matches("[a-z]")
			.WithMessage("Password must contain at least one lowercase letter.")
			.Matches("[A-Z]")
			.WithMessage("Password must contain at least one uppercase letter.")
			.Matches("[^a-zA-Z0-9]")
			.WithMessage("Password must contain at least one non-alphanumeric character.");
		RuleFor((RegisterRequest x) => x.FullName).NotEmpty().MaximumLength(256);
	}
}
