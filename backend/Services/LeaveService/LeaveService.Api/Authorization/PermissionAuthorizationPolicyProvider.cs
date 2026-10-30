using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace LeaveService.Api.Authorization;

public sealed class PermissionAuthorizationPolicyProvider(IOptions<AuthorizationOptions> options) : DefaultAuthorizationPolicyProvider(options)
{
    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName.StartsWith("Permission:", StringComparison.OrdinalIgnoreCase))
        {
            var code = policyName["Permission:".Length..];
            var policy = new AuthorizationPolicyBuilder().AddRequirements(new PermissionRequirement(code)).Build();
            return policy;
        }

        return await base.GetPolicyAsync(policyName).ConfigureAwait(false);
    }
}
