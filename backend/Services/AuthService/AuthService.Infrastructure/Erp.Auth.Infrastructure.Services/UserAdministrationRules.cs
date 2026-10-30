using System.Security.Claims;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Infrastructure.Services;

public static class UserAdministrationRules
{
    public static async Task CheckTargetAsync(AuthDbContext db, ClaimsPrincipal actor, Guid userId, bool removingAccess, CancellationToken ct)
    {
        var isSuper = actor.IsInRole("SuperAdmin");
        var targetSuper = await (from ur in db.UserRoles join r in db.Roles on ur.RoleId equals r.Id
            where ur.UserId == userId && r.Name == "SuperAdmin" select ur).AnyAsync(ct);
        if (targetSuper && !isSuper) throw new UnauthorizedAccessException("Only a SuperAdmin may manage a SuperAdmin account.");
        if (removingAccess && actor.FindFirstValue("sub") == userId.ToString())
            throw new InvalidOperationException("You cannot remove your own administrator access.");
        if (targetSuper && removingAccess) throw new InvalidOperationException("SuperAdmin recovery accounts cannot be removed through generic user administration.");

    }

    public static async Task CheckRolesAsync(AuthDbContext db, ClaimsPrincipal actor, IEnumerable<string> names, CancellationToken ct)
    {
        var roles = names.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (roles.Length == 0) throw new InvalidOperationException("At least one role is required.");
        if (await db.Roles.CountAsync(r => roles.Contains(r.Name!) && !r.IsDeleted, ct) != roles.Length)
            throw new InvalidOperationException("Unknown role.");
        if (actor.IsInRole("SuperAdmin")) return;
        if (roles.Any(r => r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) || r.Equals("Admin", StringComparison.OrdinalIgnoreCase)))
            throw new UnauthorizedAccessException("Only a SuperAdmin can grant administrator roles.");
        var granted = await (from rp in db.RolePermissions join r in db.Roles on rp.RoleId equals r.Id
            join p in db.Permissions on rp.PermissionId equals p.Id where roles.Contains(r.Name!) select p.Code).Distinct().ToListAsync(ct);
        var own = actor.FindAll("permission").Concat(actor.FindAll("permissions")).Select(c => c.Value).ToHashSet();
        if (granted.Any(p => !own.Contains(p))) throw new UnauthorizedAccessException("You cannot grant permissions beyond your own authority.");
    }
}
