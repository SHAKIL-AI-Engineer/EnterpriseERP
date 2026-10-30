namespace Erp.BuildingBlocks.CommonSecurity;

public interface ITenantContext
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
    bool IsSuperAdmin { get; }
    string TenantScope { get; }
    IReadOnlyList<Guid> AllowedCompanyIds { get; }
    Guid? DefaultCompanyId { get; }
    Guid? ActiveCompanyId { get; }

    bool HasAccessToCompany(Guid companyId);
    void EnsureCompanyAccess(Guid companyId);
}
