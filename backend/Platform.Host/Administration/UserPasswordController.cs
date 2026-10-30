using System.Security.Claims;
using AuthService.Contracts.Common;
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
[Authorize(Roles = "Admin,SuperAdmin", Policy = "Permission:auth.users.write")]
public sealed class UserPasswordController(AuthDbContext db, UserManager<AppUser> users,
    ITenantContext tenant) : ControllerBase
{
    [HttpPut("api/v1/users/{id:guid}/password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ChangePassword(Guid id, AdministratorPasswordChange request, CancellationToken ct)
    {
        ApiResponse<object> Error(string code, string message) =>
            ApiResponse<object>.Fail(HttpContext.TraceIdentifier, [new ApiError(code, message)]);

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || request.CurrentPassword.Length > 1024)
            return BadRequest(Error("PASSWORD_CONFIRMATION", "Enter your current administrator password."));
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length is < 10 or > 128)
            return BadRequest(Error("PASSWORD_LENGTH", "New password must contain 10 to 128 characters."));
        if (request.NewPassword != request.ConfirmPassword)
            return BadRequest(Error("PASSWORD_MISMATCH", "New password and confirmation do not match."));

        var actorId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        var actor = actorId is null ? null : await users.FindByIdAsync(actorId);
        if (actor is null || actor.IsDeleted || !actor.IsActive || actor.Status != UserStatus.Active)
            return Unauthorized(Error("AUTH_INVALID", "Sign in again before changing a password."));
        if (await users.IsLockedOutAsync(actor))
            return Unauthorized(Error("ACCOUNT_LOCKED", "Your account is locked. Try again after the lockout expires."));

        var target = await db.Users.SingleOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
        if (target is null) return NotFound(Error("USER_NOT_FOUND", "User not found."));
        await UserAdministrationRules.CheckTargetAsync(db, User, id, false, ct);
        if (!User.IsInRole("SuperAdmin") && target.Id != actor.Id)
        {
            // A password reset must not let an administrator take over a more privileged
            // account or one with access to companies outside their own assignment.
            await UserAdministrationRules.CheckRolesAsync(db, User, await users.GetRolesAsync(target), ct);
            var companyIds = await db.UserCompanyAccesses.Where(a => a.UserId == id && a.IsActive && !a.IsDeleted)
                .Select(a => a.CompanyGuid).ToListAsync(ct);
            if (companyIds.Count == 0 || companyIds.Any(company => !tenant.HasAccessToCompany(company)))
                return StatusCode(403, Error("COMPANY_ACCESS", "You cannot change this user's password outside your company access."));
        }

        if (!await users.CheckPasswordAsync(actor, request.CurrentPassword))
        {
            await users.AccessFailedAsync(actor);
            return BadRequest(Error("PASSWORD_CONFIRMATION", "Your current administrator password is incorrect."));
        }
        await users.ResetAccessFailedCountAsync(actor);
        if (await users.CheckPasswordAsync(target, request.NewPassword))
            return BadRequest(Error("PASSWORD_REUSED", "Choose a password different from the user's current password."));

        // Identity applies the configured password validators and concurrency checks.
        // AuthDbContext revokes access/refresh sessions when the password hash changes.
        var resetToken = await users.GeneratePasswordResetTokenAsync(target);
        target.UpdatedAt = DateTimeOffset.UtcNow;
        target.UpdatedBy = actor.Id;
        var result = await users.ResetPasswordAsync(target, resetToken, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest(ApiResponse<object>.Fail(HttpContext.TraceIdentifier,
                result.Errors.Select(e => new ApiError(e.Code, e.Description)).ToArray()));

        return Ok(ApiResponse<object>.Ok(new { userId = id, changed = true, requiresSignIn = true,
            message = "Password changed successfully. The user must sign in again on all devices." }, HttpContext.TraceIdentifier));
    }
}

public sealed record AdministratorPasswordChange(string CurrentPassword, string NewPassword, string ConfirmPassword);
