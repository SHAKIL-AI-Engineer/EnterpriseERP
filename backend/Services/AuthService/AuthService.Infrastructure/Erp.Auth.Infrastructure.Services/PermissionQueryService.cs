using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Permissions;
using AuthService.Contracts.Permissions;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Infrastructure.Services;

public sealed class PermissionQueryService(AuthDbContext db) : IPermissionQueryService
{
	public async Task<IReadOnlyList<PermissionDto>> ListAsync(CancellationToken cancellationToken = default)
	{
		return await (from p in db.Permissions.AsNoTracking()
			where !p.IsDeleted
			orderby p.Code
			select new PermissionDto
			{
				Id = p.Id,
				Code = p.Code,
				Description = p.Description
			}).ToListAsync(cancellationToken);
	}
}
