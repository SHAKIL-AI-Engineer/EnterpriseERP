namespace AuthService.Application.Models;

public sealed record UserCompanyAccessRecord(Guid Id, Guid CompanyGuid, bool IsDefaultCompany);
