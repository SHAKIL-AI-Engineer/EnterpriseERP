using AuthService.Contracts.Users;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class AssignUserRolesRequestValidator : AbstractValidator<AssignUserRolesRequest>
{
	public AssignUserRolesRequestValidator()
	{
		RuleFor((AssignUserRolesRequest x) => x.RoleNames).NotNull();
	}
}
