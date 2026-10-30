namespace AuthService.Contracts.Auth;

public sealed class CompleteTwoFactorLoginRequest
{
	public string PendingTwoFactorToken { get; init; } = string.Empty;

	public string Code { get; init; } = string.Empty;
}
