using Erp.BuildingBlocks.Contracts.Pagination;
using HRService.Application.Manpower;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace HRService.Infrastructure.Services;

public sealed class ManpowerRequirementService(HrDbContext db) : IManpowerRequirementService
{
    public async Task<Guid> CreateAsync(CreateManpowerRequirementDto dto, CancellationToken cancellationToken = default)
    {
        var requirement = new ManpowerRequirement
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            DepartmentId = dto.DepartmentId,
            DesignationId = dto.DesignationId,
            RequiredNumber = dto.RequiredNumber,
            RequestDate = dto.RequestDate,
            ExpectedJoiningDate = dto.ExpectedJoiningDate,
            Status = "Pending",
            Remarks = dto.Remarks,
            CreatedAt = BusinessTime.NowOffset,
            IsDeleted = false
        };

        db.ManpowerRequirements.Add(requirement);
        await db.SaveChangesAsync(cancellationToken);
        return requirement.Id;
    }

    public async Task UpdateAsync(Guid id, UpdateManpowerRequirementDto dto, CancellationToken cancellationToken = default)
    {
        var req = await db.ManpowerRequirements.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (req == null) return;

        req.DepartmentId = dto.DepartmentId;
        req.DesignationId = dto.DesignationId;
        req.RequiredNumber = dto.RequiredNumber;
        req.RequestDate = dto.RequestDate;
        req.ExpectedJoiningDate = dto.ExpectedJoiningDate;
        req.Status = dto.Status;
        req.Remarks = dto.Remarks;
        req.UpdatedAt = BusinessTime.NowOffset;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var req = await db.ManpowerRequirements.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (req == null) return;

        req.IsDeleted = true;
        req.DeletedAt = BusinessTime.NowOffset;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<ManpowerRequirementDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await db.ManpowerRequirements.AsNoTracking()
            .Include(r => r.Department)
            .Include(r => r.Designation)
            .Where(r => r.Id == id && !r.IsDeleted)
            .Select(r => new ManpowerRequirementDto(
                r.Id, r.CompanyId, r.DepartmentId, r.Department != null ? r.Department.Name : null,
                r.DesignationId, r.Designation != null ? r.Designation.Name : null,
                r.RequiredNumber, r.RequestDate, r.ExpectedJoiningDate, r.Status, r.Remarks))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<ManpowerRequirementDto>> ListAsync(ManpowerRequirementQuery query, CancellationToken cancellationToken = default)
    {
        var q = db.ManpowerRequirements.AsNoTracking().Where(r => !r.IsDeleted);

        if (query.CompanyId.HasValue)
            q = q.Where(r => r.CompanyId == query.CompanyId);

        if (query.DepartmentId.HasValue)
            q = q.Where(r => r.DepartmentId == query.DepartmentId);

        if (!string.IsNullOrWhiteSpace(query.Status))
            q = q.Where(r => r.Status == query.Status);

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(r => r.RequestDate)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(r => new ManpowerRequirementDto(
                r.Id, r.CompanyId, r.DepartmentId, r.Department != null ? r.Department.Name : null,
                r.DesignationId, r.Designation != null ? r.Designation.Name : null,
                r.RequiredNumber, r.RequestDate, r.ExpectedJoiningDate, r.Status, r.Remarks))
            .ToListAsync(cancellationToken);

        return new PagedResult<ManpowerRequirementDto>
        {
            Items = items,
            TotalCount = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<IEnumerable<ManpowerRequirementSummaryDto>> GetSummaryAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        // 1. Get Requirements grouped by Dept/Desig
        var requirements = await db.ManpowerRequirements.AsNoTracking()
            .Where(r => r.CompanyId == companyId && !r.IsDeleted)
            .GroupBy(r => new { r.DepartmentId, r.DesignationId })
            .Select(g => new
            {
                g.Key.DepartmentId,
                g.Key.DesignationId,
                Approved = g.Where(x => x.Status == "Approved").Sum(x => x.RequiredNumber),
                Pending = g.Where(x => x.Status == "Pending").Sum(x => x.RequiredNumber)
            })
            .ToListAsync(cancellationToken);

        // 2. Get Onboarded (Active Employees) grouped by Dept/Desig
        var onboarded = await db.EmployeeJobInfos.AsNoTracking()
            .Include(j => j.Employee)
            .Where(j => j.CompanyId == companyId && j.IsCurrent && j.Employee != null && !j.Employee.IsDeleted && j.Employee.Status == "Active")
            .GroupBy(j => new { j.DepartmentId, j.DesignationId })
            .Select(g => new
            {
                g.Key.DepartmentId,
                g.Key.DesignationId,
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);

        // 3. Combine
        var depts = await db.Departments.AsNoTracking().Where(d => d.CompanyId == companyId).ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);
        var desigs = await db.Designations.AsNoTracking().ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        var keys = requirements.Select(r => new { DepartmentId = r.DepartmentId, DesignationId = r.DesignationId })
            .Union(onboarded.Select(o => new { DepartmentId = o.DepartmentId ?? Guid.Empty, DesignationId = o.DesignationId ?? Guid.Empty }))
            .Distinct();

        var result = new List<ManpowerRequirementSummaryDto>();
        foreach (var key in keys)
        {
            if (key.DepartmentId == Guid.Empty || key.DesignationId == Guid.Empty) continue;

            var req = requirements.FirstOrDefault(r => r.DepartmentId == key.DepartmentId && r.DesignationId == key.DesignationId);
            var onb = onboarded.FirstOrDefault(o => o.DepartmentId == key.DepartmentId && o.DesignationId == key.DesignationId);

            var approved = req?.Approved ?? 0;
            var onboardCount = onb?.Count ?? 0;

            result.Add(new ManpowerRequirementSummaryDto(
                key.DepartmentId, depts.GetValueOrDefault(key.DepartmentId),
                key.DesignationId, desigs.GetValueOrDefault(key.DesignationId),
                approved,
                req?.Pending ?? 0,
                onboardCount,
                Math.Max(0, approved - onboardCount)
            ));
        }

        return result;
    }
}
