namespace HRService.Infrastructure.Options;

public sealed class EmployeeImageOptions
{
	public const string SectionName = "EmployeeImages";

	public string UploadRoot { get; set; } = "uploads/employees";

	/// <summary>Max size of raw upload before optimization.</summary>
	public long MaxUploadBytes { get; set; } = 5 * 1024 * 1024;

	/// <summary>Max size of stored file after optimization.</summary>
	public long MaxFileBytes { get; set; } = 512 * 1024;
}
