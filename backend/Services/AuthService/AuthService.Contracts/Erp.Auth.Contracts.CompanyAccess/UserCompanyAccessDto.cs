namespace AuthService.Contracts.CompanyAccess;

public sealed class UserCompanyAccessDto
{
	public Guid Id { get; init; }

	public Guid CompanyId { get; init; }

	public bool IsDefaultCompany { get; init; }
}
