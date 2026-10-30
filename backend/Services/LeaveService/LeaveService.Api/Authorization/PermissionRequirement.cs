using Microsoft.AspNetCore.Authorization;

namespace LeaveService.Api.Authorization;

public sealed class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}
