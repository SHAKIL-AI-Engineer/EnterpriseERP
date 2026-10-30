namespace AuthService.Contracts.Auth;

public sealed class UpdateUserProfileRequest
{
	public string FullName { get; init; } = string.Empty;

	public string Email { get; init; } = string.Empty;

	public string? PhoneNumber { get; init; }

	public string? Country { get; init; }

	public string? City { get; init; }

	public string? Bio { get; init; }
}
