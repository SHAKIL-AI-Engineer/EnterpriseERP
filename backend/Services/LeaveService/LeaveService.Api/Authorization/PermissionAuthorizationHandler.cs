using System.Security.Claims;
using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.AspNetCore.Authorization;

namespace LeaveService.Api.Authorization;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.IsInRole("SuperAdmin")
            || string.Equals(context.User.FindFirstValue(SecurityClaimTypes.IsSuperAdmin), "true", StringComparison.OrdinalIgnoreCase))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (context.User.Claims.Any(c =>
            (c.Type == SecurityClaimTypes.Permission || c.Type == "permission")
            && c.Value == requirement.Permission))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
