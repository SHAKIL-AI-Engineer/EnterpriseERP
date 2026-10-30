using System;
using System.Collections.Generic;
using AuthService.Contracts.CompanyAccess;
using AuthService.Contracts.Common;

namespace AuthService.Contracts.Auth;

public sealed class UserProfileResponse
{
	public Guid UserId { get; init; }

	public string Username { get; init; } = string.Empty;

	public string Email { get; init; } = string.Empty;

	public string? PhoneNumber { get; init; }

	public string FullName { get; init; } = string.Empty;

	public string? ProfilePictureUrl { get; init; }

	public string? Country { get; init; }

	public string? City { get; init; }

	public string? Bio { get; init; }

	public bool IsActive { get; init; }

	public UserStatus Status { get; init; }

	public bool IsLocked { get; init; }

	public DateTimeOffset? LastLoginAt { get; init; }

	public bool TwoFactorEnabled { get; init; }

	public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();

	public IReadOnlyList<string> Permissions { get; init; } = Array.Empty<string>();

	public IReadOnlyList<UserCompanyAccessDto> CompanyAccess { get; init; } = Array.Empty<UserCompanyAccessDto>();

	public string TenantScope { get; init; } = "company";

	public Guid? DefaultCompanyId { get; init; }
}
