using System;
using System.Collections.Generic;

namespace AuthService.Contracts.Roles;

public sealed class RoleDto
{
	public Guid Id { get; init; }

	public string Name { get; init; } = string.Empty;

	public int UserCount { get; init; }

	public IReadOnlyList<string> Permissions { get; init; } = Array.Empty<string>();
}
