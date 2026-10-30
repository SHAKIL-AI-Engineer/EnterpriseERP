using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Contracts.Permissions;

namespace AuthService.Application.Abstractions.Permissions;

public interface IPermissionQueryService
{
	Task<IReadOnlyList<PermissionDto>> ListAsync(CancellationToken cancellationToken = default);
}
