using AuthService.Contracts.Users;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class UpdateUserStatusRequestValidator : AbstractValidator<UpdateUserStatusRequest>
{
	public UpdateUserStatusRequestValidator()
	{
		RuleFor((UpdateUserStatusRequest x) => x.Status).IsInEnum();
	}
}
