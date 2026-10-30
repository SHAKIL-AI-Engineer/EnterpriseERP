using AuthService.Contracts.Roles;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class AssignRolePermissionsRequestValidator : AbstractValidator<AssignRolePermissionsRequest>
{
	public AssignRolePermissionsRequestValidator()
	{
		RuleFor((AssignRolePermissionsRequest x) => x.PermissionCodes).NotNull();
	}
}
