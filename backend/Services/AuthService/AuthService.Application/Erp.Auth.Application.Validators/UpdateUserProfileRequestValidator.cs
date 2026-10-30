using AuthService.Contracts.Auth;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class UpdateUserProfileRequestValidator : AbstractValidator<UpdateUserProfileRequest>
{
	public UpdateUserProfileRequestValidator()
	{
		RuleFor(x => x.FullName).NotEmpty().MaximumLength(256);
		RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
		RuleFor(x => x.PhoneNumber).MaximumLength(50).When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));
		RuleFor(x => x.Country).MaximumLength(100).When(x => !string.IsNullOrWhiteSpace(x.Country));
		RuleFor(x => x.City).MaximumLength(100).When(x => !string.IsNullOrWhiteSpace(x.City));
		RuleFor(x => x.Bio).MaximumLength(500).When(x => !string.IsNullOrWhiteSpace(x.Bio));
	}
}
