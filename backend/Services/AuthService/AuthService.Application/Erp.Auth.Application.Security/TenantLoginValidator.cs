using AuthService.Application.Models;

namespace AuthService.Application.Security;

public static class TenantLoginValidator
{
	public static (bool Allowed, string? Error) ValidateCompanyAccessForLogin(
		IReadOnlyList<string> roles,
		IReadOnlyList<UserCompanyAccessRecord> companyRecords)
	{
		var isSuperAdmin = roles.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);
		if (isSuperAdmin)
		{
			return (true, null);
		}

		if (companyRecords.Count == 0)
		{
			return (false, "No company assigned to your account. Contact your administrator.");
		}

		return (true, null);
	}
}
