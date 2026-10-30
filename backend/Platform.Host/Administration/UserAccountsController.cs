using System.Data;
using System.Security.Claims;
using System.Text.Json;
using AuthService.Application.Abstractions.CompanyAccess;
using AuthService.Contracts.Common;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Persistence;
using AuthService.Infrastructure.Services;
using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.Administration;

[ApiController]
[Authorize]
public sealed class UserAccountsController(AuthDbContext db, UserManager<AppUser> users,
    ICompanyExistenceChecker companies, ITenantContext tenant) : ControllerBase
{
    private Guid Actor => Guid.Parse(User.FindFirstValue("sub")!);

    [HttpPost("api/v1/users")]
    [Authorize(Policy = "Permission:auth.users.write")]
    public async Task<IActionResult> Create(CreateAccount request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.FullName)
            || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(request.Email))
            return BadRequest(new { message = "Username, full name and a valid email are required." });
        await UserAdministrationRules.CheckRolesAsync(db, User, request.RoleNames, ct);
        if (request.CompanyIds.Length == 0 || request.CompanyIds.Distinct().Count() != request.CompanyIds.Length)
            return BadRequest(new { message = "Assign at least one company without duplicates." });
        foreach (var company in request.CompanyIds)
        {
            if (!tenant.IsSuperAdmin && !tenant.HasAccessToCompany(company)) return Forbid();
            if (!await companies.ExistsAsync(company, ct)) return BadRequest(new { message = "Unknown company." });
        }
        return await db.Database.CreateExecutionStrategy().ExecuteAsync<IActionResult>(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
            var user = new AppUser { Id = Guid.NewGuid(), UserName = request.Username.Trim(), Email = request.Email.Trim(),
                FullName = request.FullName.Trim(), IsActive = false, Status = UserStatus.Pending, EmailConfirmed = false,
                CreatedAt = DateTimeOffset.UtcNow, CreatedBy = Actor, LockoutEnabled = true };
            var created = await users.CreateAsync(user, request.Password);
            if (!created.Succeeded) return BadRequest(new { message = string.Join(" ", created.Errors.Select(e => e.Description)) });
            db.UserAccountApprovals.Add(new UserAccountApproval { UserId = user.Id, RequestedBy = Actor,
                RolesJson = JsonSerializer.Serialize(request.RoleNames), CompaniesJson = JsonSerializer.Serialize(request.CompanyIds) });
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return Ok(new { userId = user.Id, message = "Account created and awaiting independent approval." });
        });
    }

    [HttpGet("api/v1/administrator/account-approvals")]
    [Authorize(Policy = "Permission:auth.users.approve")]
    public async Task<IActionResult> Approvals(CancellationToken ct) => Ok(await (
        from a in db.UserAccountApprovals.AsNoTracking() join u in db.Users on a.UserId equals u.Id
        where !u.IsDeleted orderby a.RequestedAt descending
        select new { a.Id, a.UserId, u.UserName, u.FullName, u.Email, a.RequestedBy, a.RequestedAt,
            a.RolesJson, a.CompaniesJson, a.Status, a.ReviewedBy, a.ReviewedAt, a.Reason,
            requestedByName = db.Users.Where(x => x.Id == a.RequestedBy).Select(x => x.FullName).FirstOrDefault(),
            reviewedByName = db.Users.Where(x => x.Id == a.ReviewedBy).Select(x => x.FullName).FirstOrDefault() }).Take(500).ToListAsync(ct));

    [HttpPost("api/v1/administrator/account-approvals/{id:guid}/decision")]
    [Authorize(Policy = "Permission:auth.users.approve")]
    public async Task<IActionResult> Decide(Guid id, AccountDecision decision, CancellationToken ct)
    {
        if (!decision.Approve && string.IsNullOrWhiteSpace(decision.Reason)) return BadRequest(new { message = "A rejection reason is required." });
        if (decision.Reason.Length > 2000) return BadRequest(new { message = "Reason is too long." });
        return await db.Database.CreateExecutionStrategy().ExecuteAsync<IActionResult>(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
            var approval = await db.UserAccountApprovals.SingleOrDefaultAsync(a => a.Id == id, ct);
            if (approval is null) return NotFound();
            if (approval.Status != "Pending") return Conflict(new { message = "This request has already been reviewed." });
            if (approval.RequestedBy == Actor)
            {
                var existingReviewer = await (from ur in db.UserRoles join r in db.Roles on ur.RoleId equals r.Id
                    join u in db.Users on ur.UserId equals u.Id
                    where u.Id != Actor && u.IsActive && !u.IsDeleted && (r.Name == "SuperAdmin" || r.Name == "Admin") select u.Id).AnyAsync(ct);
                var requestedRoles = JsonSerializer.Deserialize<string[]>(approval.RolesJson)!;
                var actorUser = await users.FindByIdAsync(Actor.ToString());
                if (!decision.BootstrapReviewer || !decision.Approve || !User.IsInRole("SuperAdmin") || existingReviewer
                    || requestedRoles.Length != 1 || requestedRoles[0] != "Admin" || string.IsNullOrWhiteSpace(decision.Reason)
                    || actorUser is null || !await users.CheckPasswordAsync(actorUser, decision.CurrentPassword ?? ""))
                    return BadRequest(new { message = "A different administrator must review this account. Only the first Admin reviewer can be bootstrapped by SuperAdmin with password confirmation and a reason." });
            }
            var user = await db.Users.SingleAsync(u => u.Id == approval.UserId, ct);
            if (user.IsDeleted || user.Status != UserStatus.Pending) return Conflict(new { message = "Account is no longer pending." });
            var roles = JsonSerializer.Deserialize<string[]>(approval.RolesJson)!;
            var companyIds = JsonSerializer.Deserialize<Guid[]>(approval.CompaniesJson)!;
            await UserAdministrationRules.CheckRolesAsync(db, User, roles, ct);
            foreach (var company in companyIds)
                if (!tenant.IsSuperAdmin && !tenant.HasAccessToCompany(company)) return Forbid();
            if (decision.Approve)
            {
                foreach (var company in companyIds) if (!await companies.ExistsAsync(company, ct)) return BadRequest(new { message = "A requested company is no longer available." });
                var result = await users.AddToRolesAsync(user, roles);
                if (!result.Succeeded) return BadRequest(new { message = "Unable to apply the requested roles." });
                for (var i = 0; i < companyIds.Length; i++) db.UserCompanyAccesses.Add(new UserCompanyAccess {
                    Id = Guid.NewGuid(), UserId = user.Id, CompanyGuid = companyIds[i], IsDefaultCompany = i == 0,
                    IsActive = true, CreatedAt = DateTimeOffset.UtcNow, CreatedBy = Actor });
                user.IsActive = true; user.Status = UserStatus.Active;
            }
            else { user.IsActive = false; user.Status = UserStatus.Inactive; }
            approval.Status = decision.Approve ? "Approved" : "Rejected";
            approval.ReviewedBy = Actor; approval.ReviewedAt = DateTimeOffset.UtcNow; approval.Reason = decision.Reason.Trim();
            user.UpdatedBy = Actor; user.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return Ok(new { message = "Decision saved.", approval.Status });
        });
    }

    [HttpPatch("api/v1/users/{id:guid}")]
    [Authorize(Policy = "Permission:auth.users.write")]
    public async Task<IActionResult> Update(Guid id, EditAccount request, CancellationToken ct)
    {
        await UserAdministrationRules.CheckTargetAsync(db, User, id, !request.IsActive, ct);
        var user = await users.FindByIdAsync(id.ToString());
        if (user is null || user.IsDeleted) return NotFound();
        if (user.Status == UserStatus.Pending) return BadRequest(new { message = "Review the pending account before editing access." });
        if (request.IsActive && await db.UserAccountApprovals.AnyAsync(a => a.UserId == id && a.Status != "Approved", ct))
            return BadRequest(new { message = "This account does not have an approved access request." });
        if (string.IsNullOrWhiteSpace(request.FullName) || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(request.Email))
            return BadRequest(new { message = "Full name and a valid email are required." });
        if (!string.Equals(user.Email, request.Email.Trim(), StringComparison.OrdinalIgnoreCase)) user.EmailConfirmed = false;
        user.Email = request.Email.Trim(); user.FullName = request.FullName.Trim(); user.IsActive = request.IsActive;
        user.Status = request.IsActive ? UserStatus.Active : UserStatus.Inactive;
        user.UpdatedAt = DateTimeOffset.UtcNow; user.UpdatedBy = Actor;
        var result = await users.UpdateAsync(user);
        return result.Succeeded ? Ok(new { message = "User updated." }) : BadRequest(new { message = string.Join(" ", result.Errors.Select(e => e.Description)) });
    }

    [HttpDelete("api/v1/users/{id:guid}")]
    [Authorize(Policy = "Permission:auth.users.write")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await UserAdministrationRules.CheckTargetAsync(db, User, id, true, ct);
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
        if (user is null) return NotFound();
        user.IsDeleted = true; user.IsActive = false; user.Status = UserStatus.Inactive;
        user.DeletedAt = DateTimeOffset.UtcNow; user.DeletedBy = Actor;
        await db.SaveChangesAsync(ct);
        return Ok(new { message = "Account removed; audit history retained." });
    }
}

public sealed record CreateAccount(string Username, string Email, string FullName, string Password, string[] RoleNames, Guid[] CompanyIds);
public sealed record EditAccount(string FullName, string Email, bool IsActive);
public sealed record AccountDecision(bool Approve, string Reason, bool BootstrapReviewer = false, string? CurrentPassword = null);
