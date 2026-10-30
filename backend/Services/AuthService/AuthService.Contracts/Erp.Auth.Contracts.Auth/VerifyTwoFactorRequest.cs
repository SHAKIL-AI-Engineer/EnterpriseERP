namespace AuthService.Contracts.Auth;

public sealed class VerifyTwoFactorRequest
{
	public string? PendingTwoFactorToken { get; init; }

	public string Code { get; init; } = string.Empty;
}
