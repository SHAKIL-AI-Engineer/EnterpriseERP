namespace AuthService.Contracts.Auth;

public sealed class DisableTwoFactorRequest
{
	public string Password { get; init; } = string.Empty;

	public string Code { get; init; } = string.Empty;
}
