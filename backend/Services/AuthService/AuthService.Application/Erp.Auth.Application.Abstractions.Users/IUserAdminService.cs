using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Contracts.Users;

namespace AuthService.Application.Abstractions.Users;

public interface IUserAdminService
{
	Task<(IReadOnlyList<UserListItemDto>? Items, IReadOnlyList<string> Errors)> ListUsersAsync(CancellationToken cancellationToken = default);

	Task<(bool Ok, IReadOnlyList<string> Errors)> UpdateStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default);

	Task<(bool Ok, IReadOnlyList<string> Errors)> AssignRolesAsync(Guid userId, AssignUserRolesRequest request, CancellationToken cancellationToken = default);

	Task<(IReadOnlyList<UserLoginHistoryDto>? Items, IReadOnlyList<string> Errors)> GetLoginHistoryAsync(Guid userId, CancellationToken cancellationToken = default);
}
