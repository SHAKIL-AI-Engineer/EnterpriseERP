using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace AuthService.Api.Authorization;

public sealed class PermissionAuthorizationPolicyProvider : DefaultAuthorizationPolicyProvider
{
	public PermissionAuthorizationPolicyProvider(IOptions<AuthorizationOptions> options)
		: base(options)
	{
	}

	public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
	{
		if (policyName.StartsWith("Permission:", StringComparison.OrdinalIgnoreCase))
		{
			string code = policyName["Permission:".Length..];
			AuthorizationPolicy policy = new AuthorizationPolicyBuilder().AddRequirements(new PermissionRequirement(code)).Build();
			return policy;
		}
		return await base.GetPolicyAsync(policyName).ConfigureAwait(false);
	}
}
