namespace AuthService.Application.Abstractions.CompanyAccess;

public interface ICompanyExistenceChecker
{
	Task<bool> ExistsAsync(Guid companyId, CancellationToken cancellationToken = default);
}
