using System;

namespace AuthService.Contracts.Users;

public sealed class UserLoginHistoryDto
{
	public Guid Id { get; init; }

	public string? IpAddress { get; init; }

	public string? MacAddress { get; init; }

	public string? DeviceName { get; init; }

	public string? Browser { get; init; }

	public string? OperatingSystem { get; init; }

	public bool IsSuccess { get; init; }

	public string? FailureReason { get; init; }

	public DateTimeOffset LoginAt { get; init; }
}
