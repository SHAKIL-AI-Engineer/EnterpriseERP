namespace AuthService.Infrastructure.Security;

public sealed class TenantTokenContext
{
	public bool IsSuperAdmin { get; init; }

	public string TenantScope { get; init; } = "company";

	public IReadOnlyList<Guid> CompanyGuids { get; init; } = Array.Empty<Guid>();

	public Guid? DefaultCompanyGuid { get; init; }
}
