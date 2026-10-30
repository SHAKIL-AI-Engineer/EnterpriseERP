using System.Security.Claims;
using Erp.BuildingBlocks.CommonSecurity;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;

namespace MerchandisingService.API.Authorization;

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
            && (c.Value == requirement.Permission
                || LegacyPermissionMatches(requirement.Permission, c.Value))))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }

    private static bool LegacyPermissionMatches(string requiredPermission, string claimValue) =>
        requiredPermission switch
        {
            MerchandisingPermissions.BuyerManage => claimValue == MerchandisingPermissions.LegacyBuyerManage,
            MerchandisingPermissions.StyleManage => claimValue == MerchandisingPermissions.LegacyStyleManage,
            MerchandisingPermissions.OrderCreate => claimValue == MerchandisingPermissions.LegacyOrderCreate,
            MerchandisingPermissions.OrderUpdate => claimValue == MerchandisingPermissions.LegacyOrderUpdate,
            MerchandisingPermissions.OrderConfirm => claimValue == MerchandisingPermissions.LegacyOrderConfirm,
            MerchandisingPermissions.OrderCancel => claimValue == MerchandisingPermissions.LegacyOrderCancel,
            MerchandisingPermissions.BomManage => claimValue == MerchandisingPermissions.LegacyBomManage,
            MerchandisingPermissions.CostingManage => claimValue == MerchandisingPermissions.LegacyCostingManage,
            MerchandisingPermissions.SampleManage => claimValue == MerchandisingPermissions.LegacySampleManage,
            MerchandisingPermissions.ShipmentPlanManage => claimValue == MerchandisingPermissions.LegacyShipmentPlanManage,
            MerchandisingPermissions.ReportView => claimValue == MerchandisingPermissions.LegacyReportView,
            _ => false,
        };
}
