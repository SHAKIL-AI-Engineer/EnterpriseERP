namespace Erp.BuildingBlocks.CommonSecurity;

public sealed class TenantOptions
{
    public const string SectionName = "Security";

    public bool EnforceTenant { get; set; } = true;

    public bool RequireCompanyHeaderForScopedUsers { get; set; } = true;
}
