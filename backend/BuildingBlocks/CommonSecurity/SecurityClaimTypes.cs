namespace Erp.BuildingBlocks.CommonSecurity;

public static class SecurityClaimTypes
{
    public const string TenantScope = "tenant_scope";
    public const string CompanyIds = "company_ids";
    public const string DefaultCompanyId = "default_company_id";
    public const string IsSuperAdmin = "is_super_admin";
    public const string Permission = "permission";

    public const string TenantScopeGlobal = "global";
    public const string TenantScopeCompany = "company";

    public const string CompanyIdHeader = "X-Company-Id";
}
