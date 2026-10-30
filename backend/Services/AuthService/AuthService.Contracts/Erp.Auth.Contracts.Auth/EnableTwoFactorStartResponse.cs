namespace AuthService.Contracts.Auth;

public sealed class EnableTwoFactorStartResponse
{
	public string SharedKey { get; init; } = string.Empty;

	public string OtpAuthUri { get; init; } = string.Empty;
}
