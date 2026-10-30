namespace Erp.BuildingBlocks.CommonSecurity;

/// <summary>
/// Loads live company assignments for the authenticated user (e.g. from Auth DB).
/// Used when JWT <c>company_ids</c> is missing or stale after admin reassignment.
/// </summary>
public interface ITenantCompanyAccessResolver
{
    Task<TenantCompanyAccessSnapshot?> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed record TenantCompanyAccessSnapshot(
    IReadOnlyList<Guid> CompanyIds,
    Guid? DefaultCompanyId);
