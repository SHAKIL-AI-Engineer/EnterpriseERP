using AuthService.Application.Abstractions.CompanyAccess;
using AuthService.Application.Models;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace AuthService.Infrastructure.Repositories;

public sealed class UserCompanyAccessRepository(AuthDbContext db) : IUserCompanyAccessRepository
{
	public async Task<IReadOnlyList<UserCompanyAccessRecord>> ListActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
	{
		return await (from x in db.UserCompanyAccesses.AsNoTracking()
			where x.UserId == userId && x.IsActive && !x.IsDeleted && x.CompanyGuid != Guid.Empty
			orderby x.IsDefaultCompany descending, x.CompanyGuid
			select new UserCompanyAccessRecord(x.Id, x.CompanyGuid, x.IsDefaultCompany)).ToListAsync(cancellationToken);
	}

	public async Task ReplaceAssignmentsAsync(Guid userId, IReadOnlyList<(Guid CompanyGuid, bool IsDefaultCompany)> items, Guid? actorUserId, CancellationToken cancellationToken = default)
	{
		DateTimeOffset now = BusinessTime.NowOffset;
		foreach (UserCompanyAccess row in await db.UserCompanyAccesses.Where(x => x.UserId == userId && !x.IsDeleted).ToListAsync(cancellationToken))
		{
			row.IsDeleted = true;
			row.IsActive = false;
			row.DeletedAt = now;
			row.DeletedBy = actorUserId;
		}

		foreach ((Guid companyGuid, bool isDefaultCompany) in items)
		{
			if (companyGuid == Guid.Empty)
			{
				continue;
			}

			db.UserCompanyAccesses.Add(new UserCompanyAccess
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				CompanyGuid = companyGuid,
				IsDefaultCompany = isDefaultCompany,
				IsActive = true,
				CreatedAt = now,
				CreatedBy = actorUserId,
			});
		}

		await db.SaveChangesAsync(cancellationToken);
	}
}
