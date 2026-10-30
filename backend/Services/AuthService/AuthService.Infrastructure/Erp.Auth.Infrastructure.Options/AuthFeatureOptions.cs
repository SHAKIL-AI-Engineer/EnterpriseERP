namespace AuthService.Infrastructure.Options;

public sealed class AuthFeatureOptions
{
	public const string SectionName = "Auth";

	public bool AllowSelfRegistration { get; set; }
}
