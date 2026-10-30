using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Infrastructure.Persistence.HrRead;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Infrastructure.Services;

public sealed class AttendanceEmployeeQuery(HrReadDbContext db) : IAttendanceEmployeeQuery
{
    public async Task<IReadOnlyDictionary<Guid, AttendanceEmployeeProfile>> GetProfilesAsync(
        AttendanceEmployeeFilter filter,
        CancellationToken cancellationToken = default)
    {
        var rows = await BuildEmployeeQuery(filter)
            .Select(e => new
            {
                e.Id,
                e.PunchNumber,
                e.EmployeeID,
                e.FullName
            })
            .ToListAsync(cancellationToken);

        var employeeIds = rows.Select(r => r.Id).ToList();
        if (employeeIds.Count == 0)
        {
            return new Dictionary<Guid, AttendanceEmployeeProfile>();
        }

        var jobRows = await db.EmployeeJobInfos.AsNoTracking()
            .Where(j => j.CompanyId == filter.CompanyId && j.IsCurrent && employeeIds.Contains(j.EmployeeId))
            .Select(j => new
            {
                j.EmployeeId,
                j.DepartmentId,
                j.SectionId,
                j.DesignationId,
                j.WorkLocation
            })
            .ToListAsync(cancellationToken);

        var deptIds = jobRows.Where(j => j.DepartmentId.HasValue).Select(j => j.DepartmentId!.Value).Distinct().ToList();
        var desigIds = jobRows.Where(j => j.DesignationId.HasValue).Select(j => j.DesignationId!.Value).Distinct().ToList();

        var departments = deptIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await db.Departments.AsNoTracking()
                .Where(d => deptIds.Contains(d.Id) && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        var designations = desigIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await db.Designations.AsNoTracking()
                .Where(d => desigIds.Contains(d.Id) && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        var sectionNames = await ResolveSectionNamesAsync(
            jobRows.Where(j => j.SectionId.HasValue).Select(j => j.SectionId!.Value).Distinct(),
            cancellationToken);

        var jobByEmployee = jobRows.GroupBy(j => j.EmployeeId).ToDictionary(g => g.Key, g => g.First());

        var result = new Dictionary<Guid, AttendanceEmployeeProfile>();
        foreach (var row in rows)
        {
            jobByEmployee.TryGetValue(row.Id, out var job);
            string? deptName = null;
            string? sectionName = null;
            string? desigName = null;
            Guid? deptId = null;
            Guid? sectionId = null;
            Guid? desigId = null;

            if (job != null)
            {
                deptId = job.DepartmentId;
                sectionId = job.SectionId;
                desigId = job.DesignationId;
                if (job.DepartmentId.HasValue)
                {
                    departments.TryGetValue(job.DepartmentId.Value, out deptName);
                }

                if (job.DesignationId.HasValue)
                {
                    designations.TryGetValue(job.DesignationId.Value, out desigName);
                }

                if (job.SectionId.HasValue)
                {
                    sectionNames.TryGetValue(job.SectionId.Value, out sectionName);
                }
            }

            var lineName = string.IsNullOrWhiteSpace(job?.WorkLocation) ? null : job!.WorkLocation!.Trim();

            result[row.Id] = new AttendanceEmployeeProfile(
                row.Id,
                row.PunchNumber,
                row.EmployeeID,
                row.FullName,
                deptId,
                deptName,
                sectionId,
                sectionName,
                desigId,
                desigName,
                lineName);
        }

        return result;
    }

    public async Task<HashSet<Guid>> GetEmployeeIdsMatchingFilterAsync(
        AttendanceEmployeeFilter filter,
        CancellationToken cancellationToken = default)
    {
        var ids = await BuildEmployeeQuery(filter)
            .Select(e => e.Id)
            .ToListAsync(cancellationToken);
        return ids.ToHashSet();
    }

    public async Task<PagedJobCardRosterDto> GetPagedRosterAsync(
        AttendanceEmployeeFilter filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var baseQuery = BuildEmployeeQuery(filter);
        var totalCount = await baseQuery.CountAsync(cancellationToken);

        var rows = await baseQuery
            .OrderBy(e => e.EmployeeID)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new
            {
                e.Id,
                e.PunchNumber,
                e.EmployeeID,
                e.FullName
            })
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
        {
            return new PagedJobCardRosterDto([], page, pageSize, totalCount);
        }

        var employeeIds = rows.Select(r => r.Id).ToList();
        var jobRows = await db.EmployeeJobInfos.AsNoTracking()
            .Where(j => j.CompanyId == filter.CompanyId && j.IsCurrent && employeeIds.Contains(j.EmployeeId))
            .Select(j => new
            {
                j.EmployeeId,
                j.DepartmentId,
                j.SectionId,
                j.DesignationId
            })
            .ToListAsync(cancellationToken);

        var deptIds = jobRows.Where(j => j.DepartmentId.HasValue).Select(j => j.DepartmentId!.Value).Distinct().ToList();
        var desigIds = jobRows.Where(j => j.DesignationId.HasValue).Select(j => j.DesignationId!.Value).Distinct().ToList();

        var departments = deptIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await db.Departments.AsNoTracking()
                .Where(d => deptIds.Contains(d.Id) && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        var designations = desigIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await db.Designations.AsNoTracking()
                .Where(d => desigIds.Contains(d.Id) && !d.IsDeleted)
                .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        var sectionNames = await ResolveSectionNamesAsync(
            jobRows.Where(j => j.SectionId.HasValue).Select(j => j.SectionId!.Value).Distinct(),
            cancellationToken);

        var jobByEmployee = jobRows.GroupBy(j => j.EmployeeId).ToDictionary(g => g.Key, g => g.First());

        var items = rows.Select(row =>
        {
            jobByEmployee.TryGetValue(row.Id, out var job);
            string deptName = string.Empty;
            string sectionName = string.Empty;
            string desigName = string.Empty;

            if (job != null)
            {
                if (job.DepartmentId.HasValue && departments.TryGetValue(job.DepartmentId.Value, out var dn))
                {
                    deptName = dn;
                }

                if (job.DesignationId.HasValue && designations.TryGetValue(job.DesignationId.Value, out var dsn))
                {
                    desigName = dsn;
                }

                if (job.SectionId.HasValue && sectionNames.TryGetValue(job.SectionId.Value, out var sn))
                {
                    sectionName = sn;
                }
            }

            return new JobCardRosterItemDto(
                row.PunchNumber,
                row.EmployeeID,
                row.FullName,
                deptName,
                sectionName,
                desigName);
        }).ToList();

        return new PagedJobCardRosterDto(items, page, pageSize, totalCount);
    }

    private IQueryable<HrEmployeeEntity> BuildEmployeeQuery(AttendanceEmployeeFilter filter)
    {
        var query = db.Employees.AsNoTracking()
            .Where(e => e.CompanyId == filter.CompanyId && !e.IsDeleted);

        if (!string.IsNullOrWhiteSpace(filter.EmployeeID))
        {
            var code = filter.EmployeeID.Trim();
            query = query.Where(e => e.EmployeeID == code);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(e =>
                e.FullName.ToLower().Contains(term)
                || e.EmployeeID.ToLower().Contains(term)
                || e.PunchNumber.ToString().Contains(term));
        }

        if (filter.DepartmentId.HasValue || filter.SectionId.HasValue || filter.DesignationId.HasValue
            || filter.GroupId.HasValue || !string.IsNullOrWhiteSpace(filter.LineName))
        {
            var jobQuery = db.EmployeeJobInfos.AsNoTracking()
                .Where(j => j.CompanyId == filter.CompanyId && j.IsCurrent);

            if (filter.DepartmentId.HasValue)
            {
                jobQuery = jobQuery.Where(j => j.DepartmentId == filter.DepartmentId);
            }

            if (filter.SectionId.HasValue)
            {
                jobQuery = jobQuery.Where(j => j.SectionId == filter.SectionId);
            }

            if (filter.DesignationId.HasValue)
            {
                jobQuery = jobQuery.Where(j => j.DesignationId == filter.DesignationId);
            }

            if (filter.GroupId.HasValue)
            {
                jobQuery = jobQuery.Where(j => j.GroupId == filter.GroupId);
            }

            if (!string.IsNullOrWhiteSpace(filter.LineName))
            {
                var lineName = filter.LineName.Trim().ToLower();
                jobQuery = jobQuery.Where(j =>
                    j.WorkLocation != null && j.WorkLocation.ToLower() == lineName);
            }

            var employeeIds = jobQuery.Select(j => j.EmployeeId);
            query = query.Where(e => employeeIds.Contains(e.Id));
        }

        return query;
    }

    private async Task<IReadOnlyDictionary<Guid, string>> ResolveSectionNamesAsync(
        IEnumerable<Guid> sectionIds,
        CancellationToken cancellationToken)
    {
        var ids = sectionIds.Distinct().ToList();
        var result = new Dictionary<Guid, string>();
        if (ids.Count == 0)
        {
            return result;
        }

        foreach (var id in ids)
        {
            try
            {
                var name = await db.Database
                    .SqlQueryRaw<string>(
                        "SELECT CAST(NameEn AS varchar(max)) AS Value FROM CompanyServiceDB.dbo.Sections WHERE Id = {0}",
                        id)
                    .FirstOrDefaultAsync(cancellationToken);
                if (!string.IsNullOrWhiteSpace(name))
                {
                    result[id] = name;
                }
            }
            catch
            {
                // Company DB may be unavailable in local dev
            }
        }

        return result;
    }
}
