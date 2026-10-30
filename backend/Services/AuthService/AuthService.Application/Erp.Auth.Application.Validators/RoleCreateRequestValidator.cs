using AuthService.Contracts.Roles;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class RoleCreateRequestValidator : AbstractValidator<RoleCreateRequest>
{
	public RoleCreateRequestValidator()
	{
		RuleFor((RoleCreateRequest x) => x.Name).NotEmpty().MaximumLength(256);
	}
}
