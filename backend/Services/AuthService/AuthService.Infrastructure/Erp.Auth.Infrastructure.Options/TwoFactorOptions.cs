namespace AuthService.Infrastructure.Options;

public sealed class TwoFactorOptions
{
	public const string SectionName = "Auth:TwoFactor";

	public string Issuer { get; set; } = "ERP";
}
