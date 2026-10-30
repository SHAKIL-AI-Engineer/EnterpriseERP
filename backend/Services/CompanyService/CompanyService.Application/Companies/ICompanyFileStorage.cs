namespace CompanyService.Application.Companies;

public interface ICompanyFileStorage
{
    Task<string> SaveLogoAsync(Guid companyId, CompanyFilePayload file, CancellationToken cancellationToken = default);
    Task<string> SaveSignatureAsync(Guid companyId, CompanyFilePayload file, CancellationToken cancellationToken = default);
    Task DeleteCompanyFilesAsync(Guid companyId, CancellationToken cancellationToken = default);
}
