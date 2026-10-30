using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Infrastructure.Persistence.HrRead;

using Microsoft.EntityFrameworkCore;



namespace AttendanceService.Infrastructure.Services;



public sealed class HrEmployeeDirectory(HrReadDbContext db) : IEmployeeDirectory

{

    public async Task<IReadOnlyDictionary<int, Guid>> GetEmployeeIdsByPunchNumberAsync(

        Guid companyId,

        CancellationToken cancellationToken = default)

    {

        var rows = await db.Employees

            .AsNoTracking()

            .Where(e => e.CompanyId == companyId && !e.IsDeleted)

            .Select(e => new { e.PunchNumber, e.Id })

            .ToListAsync(cancellationToken);



        var map = new Dictionary<int, Guid>();

        foreach (var row in rows)

        {

            if (row.PunchNumber > 0)

            {

                map.TryAdd(row.PunchNumber, row.Id);

            }

        }



        return map;

    }



    public async Task<IReadOnlyDictionary<Guid, EmployeeDirectoryEntry>> GetEmployeesByIdAsync(

        Guid companyId,

        CancellationToken cancellationToken = default)

    {

        var rows = await db.Employees

            .AsNoTracking()

            .Where(e => e.CompanyId == companyId && !e.IsDeleted)

            .Select(e => new EmployeeDirectoryEntry(e.Id, e.PunchNumber, e.EmployeeID, e.IsOtEnabled))

            .ToListAsync(cancellationToken);



        return rows.ToDictionary(e => e.Id);

    }



    public async Task<EmployeeDirectoryEntry?> ResolveByPunchNumberAsync(

        Guid companyId,

        int punchNumber,

        CancellationToken cancellationToken = default)

    {

        if (punchNumber <= 0)

        {

            return null;

        }



        var map = await GetEmployeeIdsByPunchNumberAsync(companyId, cancellationToken);

        if (!map.TryGetValue(punchNumber, out var id))

        {

            return null;

        }



        var byId = await GetEmployeesByIdAsync(companyId, cancellationToken);

        return byId.TryGetValue(id, out var entry) ? entry : null;

    }



    public async Task<Guid?> ResolveEmployeeIdByEmployeeIDAsync(
        Guid companyId,
        string employeeID,
        CancellationToken cancellationToken = default)
    {
        var trimmed = employeeID.Trim();
        if (trimmed.Length == 0)
        {
            return null;
        }

        var exactMatch = await db.Employees.AsNoTracking()
            .Where(e => e.CompanyId == companyId && !e.IsDeleted && e.EmployeeID == trimmed)
            .Select(e => (Guid?)e.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (exactMatch.HasValue)
        {
            return exactMatch;
        }

        if (!EmployeeFilterMatcher.TryParseFilterPunchNumber(trimmed, out var punchNumber))
        {
            return null;
        }

        return await db.Employees.AsNoTracking()
            .Where(e => e.CompanyId == companyId && !e.IsDeleted && e.PunchNumber == punchNumber)
            .Select(e => (Guid?)e.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<EmployeeDirectoryEntry>> ListByCompanyAsync(

        Guid companyId,

        CancellationToken cancellationToken = default)

    {

        return await db.Employees

            .AsNoTracking()

            .Where(e => e.CompanyId == companyId && !e.IsDeleted)

            .OrderBy(e => e.EmployeeID)

            .Select(e => new EmployeeDirectoryEntry(e.Id, e.PunchNumber, e.EmployeeID, e.IsOtEnabled))

            .ToListAsync(cancellationToken);

    }

}

