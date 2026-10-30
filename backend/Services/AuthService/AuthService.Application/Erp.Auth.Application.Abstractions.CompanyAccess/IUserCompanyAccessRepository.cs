using AuthService.Application.Models;

namespace AuthService.Application.Abstractions.CompanyAccess;

public interface IUserCompanyAccessRepository
{
	Task<IReadOnlyList<UserCompanyAccessRecord>> ListActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

	Task ReplaceAssignmentsAsync(Guid userId, IReadOnlyList<(Guid CompanyGuid, bool IsDefaultCompany)> items, Guid? actorUserId, CancellationToken cancellationToken = default);
}
