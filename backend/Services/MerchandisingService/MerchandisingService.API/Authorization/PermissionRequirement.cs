using Microsoft.AspNetCore.Authorization;

namespace MerchandisingService.API.Authorization;

public sealed class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}
