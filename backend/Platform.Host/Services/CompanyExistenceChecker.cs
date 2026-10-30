using AuthService.Application.Abstractions.CompanyAccess;
using CompanyService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.Services;

public sealed class CompanyExistenceChecker(CompanyDbContext db) : ICompanyExistenceChecker
{
    public Task<bool> ExistsAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        db.Companies.AsNoTracking().AnyAsync(c => c.Id == companyId, cancellationToken);
}
