using System;
using AuthService.Infrastructure.Identity;

namespace AuthService.Infrastructure.Entities;

public sealed class RefreshToken
{
	public Guid Id { get; set; }

	public Guid UserId { get; set; }

	public AppUser User { get; set; } = null!;

	public string TokenHash { get; set; } = string.Empty;

	public Guid FamilyId { get; set; }

	public DateTimeOffset ExpiresAt { get; set; }

	public bool IsRevoked { get; set; }

	public DateTimeOffset? RevokedAt { get; set; }

	public string? RevokedReason { get; set; }

	public Guid? ReplacedByTokenId { get; set; }

	public string? IpAddress { get; set; }

	public string? MacAddress { get; set; }

	public string? DeviceFingerprint { get; set; }

	public DateTimeOffset CreatedAt { get; set; }
}
