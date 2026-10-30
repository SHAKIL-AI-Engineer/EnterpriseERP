using HRService.Application.Employees;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeOrganogramResolver(HrDbContext db)
{
    public Task<EmployeePlacementResolution> ResolveAsync(
        Guid companyId,
        string departmentName,
        string designationName,
        string? sectionName,
        string? gradeName,
        string? groupName,
        string? lineName,
        string? supervisorEmployeeId,
        CancellationToken cancellationToken) =>
        ResolveAsync(companyId, departmentName, designationName, sectionName, gradeName, groupName, lineName,
            supervisorEmployeeId, cache: null, cancellationToken);

    public async Task<EmployeePlacementResolution> ResolveAsync(
        Guid companyId,
        string departmentName,
        string designationName,
        string? sectionName,
        string? gradeName,
        string? groupName,
        string? lineName,
        string? supervisorEmployeeId,
        EmployeeOrganogramLookupCache? cache,
        CancellationToken cancellationToken)
    {
        var deptName = departmentName.Trim();
        var desigName = designationName.Trim();
        if (deptName.Length == 0 || desigName.Length == 0)
        {
            throw new InvalidOperationException("Department and designation are required.");
        }

        Guid deptId;
        if (cache != null)
        {
            deptId = cache.TryGetDepartment(deptName)
                ?? throw new InvalidOperationException($"Department \"{deptName}\" not found for company.");
        }
        else
        {
            deptId = await ResolveDepartmentIdAsync(companyId, deptName, cancellationToken)
                ?? throw new InvalidOperationException($"Department \"{deptName}\" not found for company.");
        }

        (Guid desigId, Guid? sectionFromDesig) desigPair;
        if (cache != null)
        {
            desigPair = cache.TryGetDesignation(deptId, desigName)
                ?? throw new InvalidOperationException($"Designation \"{desigName}\" not found under department \"{deptName}\".");
        }
        else
        {
            desigPair = await ResolveDesignationAsync(deptId, desigName, cancellationToken)
                ?? throw new InvalidOperationException($"Designation \"{desigName}\" not found under department \"{deptName}\".");
        }

        Guid? sectionId = desigPair.sectionFromDesig;
        if (!string.IsNullOrWhiteSpace(sectionName))
        {
            var sectionTrim = sectionName.Trim();
            Guid? namedSection = cache != null
                ? cache.TryGetSection(deptId, sectionTrim)
                : await ResolveSectionIdAsync(deptId, sectionTrim, cancellationToken);
            if (namedSection == null)
            {
                throw new InvalidOperationException($"Section \"{sectionName}\" not found under department \"{deptName}\".");
            }

            sectionId = namedSection;
        }

        Guid? gradeId = null;
        if (!string.IsNullOrWhiteSpace(gradeName))
        {
            var gradeTrim = gradeName.Trim();
            gradeId = cache != null
                ? cache.TryGetGrade(gradeTrim)
                : await db.Grades.AsNoTracking()
                    .Where(g => g.Name == gradeTrim && !g.IsDeleted)
                    .Select(g => (Guid?)g.Id)
                    .FirstOrDefaultAsync(cancellationToken);
            if (gradeId == null)
            {
                throw new InvalidOperationException($"Grade \"{gradeName}\" not found.");
            }
        }

        Guid? groupId = null;
        if (!string.IsNullOrWhiteSpace(groupName))
        {
            var groupTrim = groupName.Trim();
            groupId = cache != null
                ? cache.TryGetGroup(groupTrim)
                : await ResolveGroupIdAsync(companyId, groupTrim, cancellationToken);
            if (groupId == null)
            {
                throw new InvalidOperationException($"Group \"{groupName}\" not found for company.");
            }
        }

        Guid? supervisorId = null;
        if (!string.IsNullOrWhiteSpace(supervisorEmployeeId))
        {
            var supTrim = supervisorEmployeeId.Trim();
            supervisorId = cache != null
                ? cache.TryGetSupervisor(supTrim)
                : await db.Employees.AsNoTracking()
                    .Where(e => e.CompanyId == companyId && e.EmployeeID == supTrim && !e.IsDeleted)
                    .Select(e => (Guid?)e.Id)
                    .FirstOrDefaultAsync(cancellationToken);
            if (supervisorId == null)
            {
                throw new InvalidOperationException($"Supervisor EmployeeID \"{supervisorEmployeeId}\" not found.");
            }
        }

        var workLocation = string.IsNullOrWhiteSpace(lineName) ? null : lineName.Trim();
        return new EmployeePlacementResolution(deptId, sectionId, desigPair.desigId, gradeId, groupId, supervisorId, workLocation);
    }

    private async Task<Guid?> ResolveDepartmentIdAsync(Guid companyId, string name, CancellationToken cancellationToken)
    {
        if (!db.Database.IsRelational())
        {
            return await db.Departments.AsNoTracking()
                .Where(d => d.CompanyId == companyId && d.Name == name && !d.IsDeleted)
                .Select(d => (Guid?)d.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        try
        {
            var id = await db.Database
                .SqlQueryRaw<Guid?>(
                    """
                    SELECT CAST(Id AS uniqueidentifier) AS Value
                    FROM CompanyServiceDB.dbo.Departments
                    WHERE CompanyId = {0}
                      AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER({1})
                    """,
                    companyId, name)
                .FirstOrDefaultAsync(cancellationToken);
            return id;
        }
        catch
        {
            return await db.Departments.AsNoTracking()
                .Where(d => d.CompanyId == companyId && d.Name == name && !d.IsDeleted)
                .Select(d => (Guid?)d.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }
    }

    private async Task<(Guid DesignationId, Guid? SectionId)?> ResolveDesignationAsync(
        Guid departmentId,
        string designationName,
        CancellationToken cancellationToken)
    {
        if (!db.Database.IsRelational())
        {
            var local = await db.Designations.AsNoTracking()
                .Where(d => d.Name == designationName && !d.IsDeleted)
                .Select(d => new { d.Id, SectionId = (Guid?)null })
                .FirstOrDefaultAsync(cancellationToken);
            return local == null ? null : (local.Id, local.SectionId);
        }

        try
        {
            var row = await db.Database
                .SqlQueryRaw<DesignationRow>(
                    """
                    SELECT CAST(ds.Id AS uniqueidentifier) AS DesignationId,
                           CAST(ds.SectionId AS uniqueidentifier) AS SectionId
                    FROM CompanyServiceDB.dbo.Designations AS ds
                    INNER JOIN CompanyServiceDB.dbo.Sections AS s ON s.Id = ds.SectionId
                    WHERE s.DepartmentId = {0}
                      AND UPPER(LTRIM(RTRIM(ds.NameEn))) = UPPER({1})
                    """,
                    departmentId, designationName)
                .FirstOrDefaultAsync(cancellationToken);
            return row == null ? null : (row.DesignationId, row.SectionId);
        }
        catch
        {
            var local = await db.Designations.AsNoTracking()
                .Where(d => d.Name == designationName && !d.IsDeleted)
                .Select(d => new { d.Id, SectionId = (Guid?)null })
                .FirstOrDefaultAsync(cancellationToken);
            return local == null ? null : (local.Id, local.SectionId);
        }
    }

    private async Task<Guid?> ResolveSectionIdAsync(Guid departmentId, string sectionName, CancellationToken cancellationToken)
    {
        if (!db.Database.IsRelational())
        {
            return null;
        }

        try
        {
            return await db.Database
                .SqlQueryRaw<Guid?>(
                    """
                    SELECT CAST(Id AS uniqueidentifier) AS Value
                    FROM CompanyServiceDB.dbo.Sections
                    WHERE DepartmentId = {0}
                      AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER({1})
                    """,
                    departmentId, sectionName)
                .FirstOrDefaultAsync(cancellationToken);
        }
        catch
        {
            return null;
        }
    }

    private async Task<Guid?> ResolveGroupIdAsync(Guid companyId, string groupName, CancellationToken cancellationToken)
    {
        if (!db.Database.IsRelational())
        {
            return null;
        }

        try
        {
            return await db.Database
                .SqlQueryRaw<Guid?>(
                    """
                    SELECT CAST(Id AS uniqueidentifier) AS Value
                    FROM CompanyServiceDB.dbo.Groups
                    WHERE CompanyId = {0}
                      AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER({1})
                    """,
                    companyId, groupName)
                .FirstOrDefaultAsync(cancellationToken);
        }
        catch
        {
            return null;
        }
    }

    private sealed class DesignationRow
    {
        public Guid DesignationId { get; set; }
        public Guid? SectionId { get; set; }
    }
}
