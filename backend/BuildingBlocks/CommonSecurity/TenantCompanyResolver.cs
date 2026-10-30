namespace Erp.BuildingBlocks.CommonSecurity;

public static class TenantCompanyResolver
{
	public static Guid ResolveCompanyId(ITenantContext tenant, Guid? requestedCompanyId)
	{
		if (tenant.IsSuperAdmin)
		{
			if (requestedCompanyId.HasValue && requestedCompanyId.Value != Guid.Empty)
			{
				return requestedCompanyId.Value;
			}

			if (tenant.ActiveCompanyId.HasValue)
			{
				return tenant.ActiveCompanyId.Value;
			}

			throw new UnauthorizedAccessException("Company context is required. Send the X-Company-Id header.");
		}

		if (requestedCompanyId.HasValue && requestedCompanyId.Value != Guid.Empty)
		{
			if (tenant.HasAccessToCompany(requestedCompanyId.Value))
			{
				return requestedCompanyId.Value;
			}

			// Ignore query/body company outside scope; use active tenant company instead.
		}

		if (tenant.ActiveCompanyId.HasValue)
		{
			return tenant.ActiveCompanyId.Value;
		}

		throw new UnauthorizedAccessException("Company context is required. Send the X-Company-Id header.");
	}

	public static IReadOnlyList<Guid> ResolveAllowedCompanyIds(ITenantContext tenant)
	{
		if (tenant.IsSuperAdmin)
		{
			return Array.Empty<Guid>();
		}

		return tenant.AllowedCompanyIds;
	}
}
