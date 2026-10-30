namespace AuthService.Contracts.CompanyAccess;

public sealed class UserCompanyAccessItemDto
{
	public Guid CompanyId { get; init; }

	public bool IsDefaultCompany { get; init; }
}
