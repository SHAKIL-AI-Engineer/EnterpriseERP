using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AuthService.Contracts.CompanyAccess;

/// <summary>
/// Admin operations for assigning companies to users (shared contract referenced by API and infrastructure).
/// </summary>
public interface ICompanyAccessAdminService
{
	Task<(IReadOnlyList<UserCompanyAccessDto>? Data, IReadOnlyList<string> Errors)> GetForUserAsync(Guid targetUserId, CancellationToken cancellationToken = default);

	Task<(IReadOnlyList<UserCompanyAccessDto>? Data, IReadOnlyList<string> Errors)> SetForUserAsync(Guid targetUserId, SetUserCompanyAccessRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
}
