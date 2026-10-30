using System;
using System.Collections.Generic;
using AuthService.Contracts.Common;
using AuthService.Contracts.CompanyAccess;

namespace AuthService.Contracts.Users;

public sealed class UserListItemDto
{
	public Guid Id { get; init; }

	public string FullName { get; init; } = string.Empty;

	public string UserName { get; init; } = string.Empty;

	public string Email { get; init; } = string.Empty;

	public string? PhoneNumber { get; init; }

	public UserStatus Status { get; init; }

	public bool IsActive { get; init; }

	public bool IsLocked { get; init; }

	public DateTimeOffset? LastLoginAt { get; init; }

	public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();

	public IReadOnlyList<UserCompanyAccessDto> CompanyAccess { get; init; } = Array.Empty<UserCompanyAccessDto>();
}
