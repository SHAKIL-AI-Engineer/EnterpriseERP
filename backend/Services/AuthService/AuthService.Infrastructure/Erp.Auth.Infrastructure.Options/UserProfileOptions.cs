namespace AuthService.Infrastructure.Options;

public sealed class UserProfileOptions
{
	public const string SectionName = "UserProfiles";

	public string UploadRoot { get; set; } = "uploads/user-profiles";

	public long MaxUploadBytes { get; set; } = 5 * 1024 * 1024;

	public long MaxFileBytes { get; set; } = 512 * 1024;
}
