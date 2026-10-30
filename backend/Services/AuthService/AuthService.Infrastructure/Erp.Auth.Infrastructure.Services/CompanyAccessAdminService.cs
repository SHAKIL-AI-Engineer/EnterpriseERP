using Microsoft.AspNetCore.Http;
using AuthService.Infrastructure.Persistence;
using Erp.BuildingBlocks.CommonSecurity;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Abstractions.CompanyAccess;
using AuthService.Contracts.CompanyAccess;
using AuthService.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Infrastructure.Services;

public sealed class CompanyAccessAdminService(
	IUserCompanyAccessRepository repository,
	UserManager<AppUser> userManager,
	IAuthService authService,
    AuthDbContext db, IHttpContextAccessor http, ITenantContext tenant,
	ICompanyExistenceChecker? companyChecker = null) : ICompanyAccessAdminService
{
	public async Task<(IReadOnlyList<UserCompanyAccessDto>? Data, IReadOnlyList<string> Errors)> GetForUserAsync(
		Guid targetUserId,
		CancellationToken cancellationToken = default)
	{
		var user = await userManager.FindByIdAsync(targetUserId.ToString());
		if (user is null || user.IsDeleted)
		{
			return (Data: null, Errors: new[] { "User not found." });
		}

		var dto = (await repository.ListActiveByUserIdAsync(targetUserId, cancellationToken))
			.Select(r => new UserCompanyAccessDto
			{
				Id = r.Id,
				CompanyId = r.CompanyGuid,
				IsDefaultCompany = r.IsDefaultCompany,
			})
			.ToList();

		return (Data: dto, Errors: Array.Empty<string>());
	}

	public async Task<(IReadOnlyList<UserCompanyAccessDto>? Data, IReadOnlyList<string> Errors)> SetForUserAsync(
		Guid targetUserId,
		SetUserCompanyAccessRequest request,
		Guid actorUserId,
		CancellationToken cancellationToken = default)
	{
		var user = await userManager.FindByIdAsync(targetUserId.ToString());
		if (user is null || user.IsDeleted)
		{
			return (Data: null, Errors: new[] { "User not found." });
		}

		await UserAdministrationRules.CheckTargetAsync(db, http.HttpContext!.User, targetUserId, false, cancellationToken);
        if (request.Items.Any(x => !tenant.IsSuperAdmin && !tenant.HasAccessToCompany(x.CompanyId)))
            throw new UnauthorizedAccessException("You cannot grant access to an unassigned company.");
        var roles = await userManager.GetRolesAsync(user);
		var isSuperAdmin = roles.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);

		var pairs = request.Items
			.Where(x => x.CompanyId != Guid.Empty)
			.Select(x => (CompanyGuid: x.CompanyId, IsDefaultCompany: x.IsDefaultCompany))
			.ToList();

		if (!isSuperAdmin && pairs.Count == 0)
		{
			return (Data: null, Errors: new[] { "At least one company must be assigned for non-SuperAdmin users." });
		}

		if (pairs.Any(p => p.CompanyGuid == Guid.Empty))
		{
			return (Data: null, Errors: new[] { "Invalid company identifier." });
		}

		if (pairs.Select(p => p.CompanyGuid).Distinct().Count() != pairs.Count)
		{
			return (Data: null, Errors: new[] { "Duplicate company assignments are not allowed." });
		}

		if (companyChecker is not null)
		{
			foreach (var pair in pairs)
			{
				if (!await companyChecker.ExistsAsync(pair.CompanyGuid, cancellationToken))
				{
					return (Data: null, Errors: new[] { $"Company {pair.CompanyGuid} does not exist." });
				}
			}
		}

		if (pairs.Count > 0 && !pairs.Any(p => p.IsDefaultCompany))
		{
			pairs[0] = (pairs[0].CompanyGuid, true);
		}

		await repository.ReplaceAssignmentsAsync(targetUserId, pairs, actorUserId, cancellationToken);
		await authService.RevokeAllRefreshTokensAsync(targetUserId, cancellationToken);
		return await GetForUserAsync(targetUserId, cancellationToken);
	}
}
