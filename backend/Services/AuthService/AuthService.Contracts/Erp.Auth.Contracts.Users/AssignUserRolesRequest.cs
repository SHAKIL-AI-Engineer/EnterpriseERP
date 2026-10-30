using System.Collections.Generic;

namespace AuthService.Contracts.Users;

public sealed class AssignUserRolesRequest
{
	public IReadOnlyList<string> RoleNames { get; init; } = new List<string>();
}
