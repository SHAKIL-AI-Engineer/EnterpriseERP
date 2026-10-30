using System;
using AuthService.Infrastructure.Identity;

namespace AuthService.Infrastructure.Entities;

public sealed class User2FA
{
	public Guid Id { get; set; }

	public Guid UserId { get; set; }

	public AppUser User { get; set; } = null!;

	public bool IsEnabled { get; set; }

	public string Method { get; set; } = "Authenticator";

	public string SecretKey { get; set; } = string.Empty;

	public string? RecoveryCodesHash { get; set; }

	public DateTimeOffset? EnabledAt { get; set; }
}
