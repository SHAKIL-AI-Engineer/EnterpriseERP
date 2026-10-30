using System;
using System.Collections.Generic;

namespace AuthService.Contracts.Auth;

public sealed class LoginResponse
{
	public string AccessToken { get; init; } = string.Empty;

	public string RefreshToken { get; init; } = string.Empty;

	public int ExpiresInSeconds { get; init; }

	public Guid UserId { get; init; }

	public string Username { get; init; } = string.Empty;

	public string FullName { get; init; } = string.Empty;

	public string Email { get; init; } = string.Empty;

	public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();

	public IReadOnlyList<string> Permissions { get; init; } = Array.Empty<string>();

	public bool RequiresTwoFactor { get; init; }

	public string? PendingTwoFactorToken { get; init; }
}
