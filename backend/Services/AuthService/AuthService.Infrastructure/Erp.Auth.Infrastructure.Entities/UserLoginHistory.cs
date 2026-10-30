using System;
using AuthService.Infrastructure.Identity;

namespace AuthService.Infrastructure.Entities;

public sealed class UserLoginHistory
{
	public Guid Id { get; set; }

	public Guid UserId { get; set; }

	public AppUser User { get; set; } = null!;

	public string? IpAddress { get; set; }

	public string? MacAddress { get; set; }

	public string? DeviceName { get; set; }

	public string? Browser { get; set; }

	public string? OperatingSystem { get; set; }

	public bool IsSuccess { get; set; }

	public string? FailureReason { get; set; }

	public DateTimeOffset LoginAt { get; set; }
}
