using System;
using AuthService.Infrastructure.Identity;

namespace AuthService.Infrastructure.Entities;

public sealed class UserDevice
{
	public Guid Id { get; set; }

	public Guid UserId { get; set; }

	public AppUser User { get; set; } = null!;

	public string? DeviceName { get; set; }

	public string? IpAddress { get; set; }

	public string? MacAddress { get; set; }

	public string? DeviceFingerprint { get; set; }

	public bool IsTrusted { get; set; }

	public DateTimeOffset? LastUsedAt { get; set; }
}
