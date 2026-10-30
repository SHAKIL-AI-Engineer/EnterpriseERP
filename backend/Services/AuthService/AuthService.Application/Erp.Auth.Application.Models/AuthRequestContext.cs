namespace AuthService.Application.Models;

public sealed record AuthRequestContext(
	string? IpAddress,
	string? MacAddress,
	string? DeviceFingerprint,
	string? UserAgent);
