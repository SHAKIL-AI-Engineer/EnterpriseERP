namespace AuthService.Contracts.Auth;

public sealed class TwoFactorCodeRequest
{
	public string Code { get; init; } = string.Empty;
}
