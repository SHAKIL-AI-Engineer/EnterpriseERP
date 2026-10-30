using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Contracts.Roles;

namespace AuthService.Application.Abstractions.Roles;

public interface IRoleAdminService
{
	Task<(IReadOnlyList<RoleDto>? Items, IReadOnlyList<string> Errors)> ListRolesAsync(CancellationToken cancellationToken = default);

	Task<(RoleDto? Role, IReadOnlyList<string> Errors)> CreateRoleAsync(RoleCreateRequest request, CancellationToken cancellationToken = default);

	Task<(bool Ok, IReadOnlyList<string> Errors)> AssignPermissionsAsync(Guid roleId, AssignRolePermissionsRequest request, CancellationToken cancellationToken = default);
}
