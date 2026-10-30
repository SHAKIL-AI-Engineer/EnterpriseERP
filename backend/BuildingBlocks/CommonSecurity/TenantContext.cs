namespace Erp.BuildingBlocks.CommonSecurity;

public sealed class TenantContext : ITenantContext
{
    public Guid? UserId { get; internal set; }
    public bool IsAuthenticated { get; internal set; }
    public bool IsSuperAdmin { get; internal set; }
    public string TenantScope { get; internal set; } = SecurityClaimTypes.TenantScopeCompany;
    public IReadOnlyList<Guid> AllowedCompanyIds { get; internal set; } = Array.Empty<Guid>();
    public Guid? DefaultCompanyId { get; internal set; }
    public Guid? ActiveCompanyId { get; internal set; }

    public bool HasAccessToCompany(Guid companyId)
    {
        if (!IsAuthenticated)
        {
            return false;
        }

        if (IsSuperAdmin || TenantScope == SecurityClaimTypes.TenantScopeGlobal)
        {
            return true;
        }

        return AllowedCompanyIds.Contains(companyId);
    }

    public void EnsureCompanyAccess(Guid companyId)
    {
        if (!HasAccessToCompany(companyId))
        {
            throw new UnauthorizedAccessException("Access to the requested company is not allowed.");
        }
    }
}
