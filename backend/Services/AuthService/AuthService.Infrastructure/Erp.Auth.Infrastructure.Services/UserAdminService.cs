using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Users;
using AuthService.Contracts.CompanyAccess;
using AuthService.Contracts.Common;
using AuthService.Contracts.Users;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace AuthService.Infrastructure.Services;

public sealed class UserAdminService(AuthDbContext db, UserManager<AppUser> userManager, IHttpContextAccessor http) : IUserAdminService
{
	public async Task<(IReadOnlyList<UserListItemDto>? Items, IReadOnlyList<string> Errors)> ListUsersAsync(CancellationToken cancellationToken = default)
	{
		DateTimeOffset now = DateTimeOffset.UtcNow;
		var users = await (from u in db.Users.AsNoTracking()
			where !u.IsDeleted
			orderby u.UserName
			select new
			{
				u.Id,
				u.FullName,
				u.UserName,
				u.Email,
				u.PhoneNumber,
				u.Status,
				u.IsActive,
				u.LockoutEnd,
				u.LastLoginAt
			}).ToListAsync(cancellationToken);
		List<Guid> userIds = users.Select(u => u.Id).ToList();
		var roleRows = await (from ur in db.UserRoles.AsNoTracking()
			join r in db.Roles.AsNoTracking() on ur.RoleId equals r.Id
			where userIds.Contains(ur.UserId) && !r.IsDeleted && r.Name != null
			select new { ur.UserId, RoleName = r.Name! }).ToListAsync(cancellationToken);
		Dictionary<Guid, List<string>> rolesByUser = roleRows
			.GroupBy(r => r.UserId)
			.ToDictionary(g => g.Key, g => g.Select(x => x.RoleName).OrderBy(x => x).ToList());
		var companyRows = await (from c in db.UserCompanyAccesses.AsNoTracking()
			where userIds.Contains(c.UserId) && c.IsActive && !c.IsDeleted
			orderby c.IsDefaultCompany descending, c.CompanyGuid
			select new
			{
				c.UserId,
				Dto = new UserCompanyAccessDto
				{
					Id = c.Id,
					CompanyId = c.CompanyGuid,
					IsDefaultCompany = c.IsDefaultCompany
				}
			}).ToListAsync(cancellationToken);
		Dictionary<Guid, List<UserCompanyAccessDto>> companiesByUser = companyRows
			.GroupBy(c => c.UserId)
			.ToDictionary(g => g.Key, g => g.Select(x => x.Dto).ToList());
		List<UserListItemDto> list = users.Select(u => new UserListItemDto
		{
			Id = u.Id,
			FullName = u.FullName,
			UserName = (u.UserName ?? string.Empty),
			Email = (u.Email ?? string.Empty),
			PhoneNumber = u.PhoneNumber,
			Status = u.Status,
			IsActive = u.IsActive,
			IsLocked = u.LockoutEnd.HasValue && u.LockoutEnd > now,
			LastLoginAt = u.LastLoginAt,
			Roles = rolesByUser.TryGetValue(u.Id, out List<string>? roles) ? roles : Array.Empty<string>(),
			CompanyAccess = companiesByUser.TryGetValue(u.Id, out List<UserCompanyAccessDto>? companies) ? companies : Array.Empty<UserCompanyAccessDto>()
		}).ToList();
		return (list, Array.Empty<string>());
	}

	public async Task<(bool Ok, IReadOnlyList<string> Errors)> UpdateStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user == null || user.IsDeleted)
		{
			return (Ok: false, Errors: new string[1] { "User not found." });
		}
		await UserAdministrationRules.CheckTargetAsync(db, http.HttpContext!.User, userId, !request.IsActive || request.Status != UserStatus.Active, cancellationToken);
        if (user.Status == UserStatus.Pending) throw new InvalidOperationException("Approve the pending account through the approval queue first.");
        if (request.IsActive != (request.Status == UserStatus.Active))
            return (false, new[] { "Active status must match the account activation setting." });
        if (request.IsActive && await db.UserAccountApprovals.AnyAsync(a => a.UserId == userId && a.Status != "Approved", cancellationToken))
            throw new InvalidOperationException("This account does not have an approved access request.");
        user.Status = request.Status;
		user.IsActive = request.IsActive;
		user.UpdatedAt = BusinessTime.NowOffset;
		IdentityResult result = await userManager.UpdateAsync(user);
		if (!result.Succeeded)
		{
			return (Ok: false, Errors: result.Errors.Select((IdentityError e) => e.Description).ToList());
		}
		return (Ok: true, Errors: Array.Empty<string>());
	}

	public async Task<(bool Ok, IReadOnlyList<string> Errors)> AssignRolesAsync(Guid userId, AssignUserRolesRequest request, CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user == null || user.IsDeleted)
		{
			return (Ok: false, Errors: new string[1] { "User not found." });
		}
		await UserAdministrationRules.CheckTargetAsync(db, http.HttpContext!.User, userId, true, cancellationToken);
        await UserAdministrationRules.CheckRolesAsync(db, http.HttpContext!.User, request.RoleNames, cancellationToken);
        if (user.Status == UserStatus.Pending) throw new InvalidOperationException("Role changes for pending accounts must be reviewed through their original request.");
        List<string> desired = request.RoleNames.Select((string n) => n.Trim()).Where((string n) => n.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
		foreach (string roleName in desired)
		{
			if (!await db.Roles.AnyAsync((AppRole r) => r.Name == roleName && !r.IsDeleted, cancellationToken))
			{
				return (Ok: false, Errors: new string[1] { "Unknown role: " + roleName });
			}
		}
		return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () => {
        await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, cancellationToken);
        IList<string> current = await userManager.GetRolesAsync(user);
		var remove = await userManager.RemoveFromRolesAsync(user, current);
        if (!remove.Succeeded) return (Ok: false, Errors: (IReadOnlyList<string>)remove.Errors.Select(e => e.Description).ToList());
		if (desired.Count > 0)
		{
			IdentityResult add = await userManager.AddToRolesAsync(user, desired);
			if (!add.Succeeded)
			{
				return (Ok: false, Errors: add.Errors.Select((IdentityError e) => e.Description).ToList());
			}
		}
		await transaction.CommitAsync(cancellationToken);
        return (Ok: true, Errors: (IReadOnlyList<string>)Array.Empty<string>());
        });
	}

	public async Task<(IReadOnlyList<UserLoginHistoryDto>? Items, IReadOnlyList<string> Errors)> GetLoginHistoryAsync(Guid userId, CancellationToken cancellationToken = default)
	{
		if ((await userManager.FindByIdAsync(userId.ToString()))?.IsDeleted ?? true)
		{
			return (Items: null, Errors: new string[1] { "User not found." });
		}
		List<UserLoginHistoryDto> rows = await (from h in db.UserLoginHistories.AsNoTracking()
			where h.UserId == userId
			orderby h.LoginAt descending
			select new UserLoginHistoryDto
			{
				Id = h.Id,
				IpAddress = h.IpAddress,
				MacAddress = h.MacAddress,
				DeviceName = h.DeviceName,
				Browser = h.Browser,
				OperatingSystem = h.OperatingSystem,
				IsSuccess = h.IsSuccess,
				FailureReason = h.FailureReason,
				LoginAt = h.LoginAt
			}).Take(500).ToListAsync(cancellationToken);
		return (rows, Array.Empty<string>());
	}
}
