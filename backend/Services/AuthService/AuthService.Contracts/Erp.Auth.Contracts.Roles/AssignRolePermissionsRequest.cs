using System.Collections.Generic;

namespace AuthService.Contracts.Roles;

public sealed class AssignRolePermissionsRequest
{
	public IReadOnlyList<string> PermissionCodes { get; init; } = new List<string>();
}
