using System.Collections.Concurrent;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

/// <summary>
/// In-memory organogram lookups for a company, built once per import batch to avoid per-row SQL.
/// </summary>
public sealed class EmployeeOrganogramLookupCache
{
    private readonly Dictionary<string, Guid> _departments;
    private readonly Dictionary<(Guid DeptId, string Name), (Guid DesignationId, Guid? SectionId)> _designations;
    private readonly Dictionary<(Guid DeptId, string Name), Guid> _sections;
    private readonly Dictionary<string, Guid> _groups;
    private readonly Dictionary<string, Guid> _grades;
    private readonly ConcurrentDictionary<string, Guid> _supervisorsByEmployeeId;

    private EmployeeOrganogramLookupCache(
        Dictionary<string, Guid> departments,
        Dictionary<(Guid, string), (Guid, Guid?)> designations,
        Dictionary<(Guid, string), Guid> sections,
        Dictionary<string, Guid> groups,
        Dictionary<string, Guid> grades,
        ConcurrentDictionary<string, Guid> supervisors)
    {
        _departments = departments;
        _designations = designations;
        _sections = sections;
        _groups = groups;
        _grades = grades;
        _supervisorsByEmployeeId = supervisors;
    }

    public static async Task<EmployeeOrganogramLookupCache> LoadAsync(
        HrDbContext db,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        var departments = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        var designations = new Dictionary<(Guid, string), (Guid, Guid?)>(new DeptNameComparer());
        var sections = new Dictionary<(Guid, string), Guid>(new DeptNameComparer());
        var groups = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        var grades = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);

        if (db.Database.IsRelational())
        {
            await LoadCompanyOrganogramAsync(db, companyId, departments, designations, sections, groups, cancellationToken);
        }
        else
        {
            await LoadLocalOrganogramAsync(db, companyId, departments, designations, cancellationToken);
        }

        var gradeRows = await db.Grades.AsNoTracking()
            .Where(g => !g.IsDeleted)
            .Select(g => new { g.Id, g.Name })
            .ToListAsync(cancellationToken);
        foreach (var g in gradeRows)
        {
            grades[NormalizeKey(g.Name)] = g.Id;
        }

        var supervisorRows = await db.Employees.AsNoTracking()
            .Where(e => e.CompanyId == companyId && !e.IsDeleted)
            .Select(e => new { e.EmployeeID, e.Id })
            .ToListAsync(cancellationToken);
        var supervisors = new ConcurrentDictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        foreach (var s in supervisorRows)
        {
            supervisors[s.EmployeeID] = s.Id;
        }

        return new EmployeeOrganogramLookupCache(
            departments, designations, sections, groups, grades, supervisors);
    }

    public Guid? TryGetDepartment(string name) =>
        _departments.TryGetValue(NormalizeKey(name), out var id) ? id : null;

    public (Guid DesignationId, Guid? SectionId)? TryGetDesignation(Guid departmentId, string name) =>
        _designations.TryGetValue((departmentId, NormalizeKey(name)), out var v) ? v : null;

    public Guid? TryGetSection(Guid departmentId, string name) =>
        _sections.TryGetValue((departmentId, NormalizeKey(name)), out var id) ? id : null;

    public Guid? TryGetGroup(string name) =>
        _groups.TryGetValue(NormalizeKey(name), out var id) ? id : null;

    public Guid? TryGetGrade(string name) =>
        _grades.TryGetValue(NormalizeKey(name), out var id) ? id : null;

    public Guid? TryGetSupervisor(string employeeId) =>
        _supervisorsByEmployeeId.TryGetValue(employeeId.Trim(), out var id) ? id : null;

    public void RegisterSupervisor(string employeeId, Guid id) =>
        _supervisorsByEmployeeId[employeeId.Trim()] = id;

    private static async Task LoadLocalOrganogramAsync(
        HrDbContext db,
        Guid companyId,
        Dictionary<string, Guid> departments,
        Dictionary<(Guid, string), (Guid, Guid?)> designations,
        CancellationToken cancellationToken)
    {
        var deptRows = await db.Departments.AsNoTracking()
            .Where(d => d.CompanyId == companyId && !d.IsDeleted)
            .Select(d => new { d.Id, d.Name })
            .ToListAsync(cancellationToken);
        foreach (var d in deptRows)
        {
            departments[NormalizeKey(d.Name)] = d.Id;
        }

        var desigRows = await db.Designations.AsNoTracking()
            .Where(d => !d.IsDeleted)
            .Select(d => new { d.Id, d.Name })
            .ToListAsync(cancellationToken);
        foreach (var d in desigRows)
        {
            var deptId = deptRows.Count == 1 ? deptRows[0].Id : Guid.Empty;
            if (deptId != Guid.Empty)
            {
                designations[(deptId, NormalizeKey(d.Name))] = (d.Id, null);
            }
        }

    }

    private static async Task LoadCompanyOrganogramAsync(
        HrDbContext db,
        Guid companyId,
        Dictionary<string, Guid> departments,
        Dictionary<(Guid, string), (Guid, Guid?)> designations,
        Dictionary<(Guid, string), Guid> sections,
        Dictionary<string, Guid> groups,
        CancellationToken cancellationToken)
    {
        try
        {
            var deptRows = await db.Database.SqlQueryRaw<OrganogramNameRow>(
                """
                SELECT CAST(Id AS uniqueidentifier) AS Id, LTRIM(RTRIM(NameEn)) AS Name
                FROM CompanyServiceDB.dbo.Departments
                WHERE CompanyId = {0}
                """,
                companyId).ToListAsync(cancellationToken);
            foreach (var d in deptRows)
            {
                if (!string.IsNullOrWhiteSpace(d.Name))
                {
                    departments[NormalizeKey(d.Name)] = d.Id;
                }
            }

            var desigRows = await db.Database.SqlQueryRaw<DesignationCacheRow>(
                """
                SELECT CAST(ds.Id AS uniqueidentifier) AS DesignationId,
                       CAST(ds.SectionId AS uniqueidentifier) AS SectionId,
                       CAST(s.DepartmentId AS uniqueidentifier) AS DepartmentId,
                       LTRIM(RTRIM(ds.NameEn)) AS Name
                FROM CompanyServiceDB.dbo.Designations AS ds
                INNER JOIN CompanyServiceDB.dbo.Sections AS s ON s.Id = ds.SectionId
                INNER JOIN CompanyServiceDB.dbo.Departments AS d ON d.Id = s.DepartmentId
                WHERE d.CompanyId = {0}
                """,
                companyId).ToListAsync(cancellationToken);
            foreach (var row in desigRows)
            {
                if (!string.IsNullOrWhiteSpace(row.Name))
                {
                    designations[(row.DepartmentId, NormalizeKey(row.Name))] = (row.DesignationId, row.SectionId);
                }
            }

            var sectionRows = await db.Database.SqlQueryRaw<SectionCacheRow>(
                """
                SELECT CAST(s.Id AS uniqueidentifier) AS Id,
                       CAST(s.DepartmentId AS uniqueidentifier) AS DepartmentId,
                       LTRIM(RTRIM(s.NameEn)) AS Name
                FROM CompanyServiceDB.dbo.Sections AS s
                INNER JOIN CompanyServiceDB.dbo.Departments AS d ON d.Id = s.DepartmentId
                WHERE d.CompanyId = {0}
                """,
                companyId).ToListAsync(cancellationToken);
            foreach (var row in sectionRows)
            {
                if (!string.IsNullOrWhiteSpace(row.Name))
                {
                    sections[(row.DepartmentId, NormalizeKey(row.Name))] = row.Id;
                }
            }

            var groupRows = await db.Database.SqlQueryRaw<OrganogramNameRow>(
                """
                SELECT CAST(Id AS uniqueidentifier) AS Id, LTRIM(RTRIM(NameEn)) AS Name
                FROM CompanyServiceDB.dbo.Groups
                WHERE CompanyId = {0}
                """,
                companyId).ToListAsync(cancellationToken);
            foreach (var g in groupRows)
            {
                if (!string.IsNullOrWhiteSpace(g.Name))
                {
                    groups[NormalizeKey(g.Name)] = g.Id;
                }
            }
        }
        catch
        {
            await LoadLocalOrganogramAsync(db, companyId, departments, designations, cancellationToken);
        }
    }

    private static string NormalizeKey(string name) => name.Trim();

    private sealed class OrganogramNameRow
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
    }

    private sealed class DesignationCacheRow
    {
        public Guid DesignationId { get; set; }
        public Guid? SectionId { get; set; }
        public Guid DepartmentId { get; set; }
        public string Name { get; set; } = "";
    }

    private sealed class SectionCacheRow
    {
        public Guid Id { get; set; }
        public Guid DepartmentId { get; set; }
        public string Name { get; set; } = "";
    }

    private sealed class DeptNameComparer : IEqualityComparer<(Guid DeptId, string Name)>
    {
        public bool Equals((Guid DeptId, string Name) x, (Guid DeptId, string Name) y) =>
            x.DeptId == y.DeptId && string.Equals(x.Name, y.Name, StringComparison.OrdinalIgnoreCase);

        public int GetHashCode((Guid DeptId, string Name) obj) =>
            HashCode.Combine(obj.DeptId, StringComparer.OrdinalIgnoreCase.GetHashCode(obj.Name));
    }
}
