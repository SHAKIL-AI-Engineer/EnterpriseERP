namespace AuthService.Contracts.Auth;

public sealed class RefreshTokenRequest
{
	public string? AccessToken { get; init; }

	public string RefreshToken { get; init; } = string.Empty;
}
