namespace AuthService.Contracts.Auth;

public sealed class RegisterRequest
{
	public string Username { get; init; } = string.Empty;

	public string Email { get; init; } = string.Empty;

	public string Password { get; init; } = string.Empty;

	public string FullName { get; init; } = string.Empty;
}
