using CompanyService.Application.Organogram;
using CompanyService.Domain.Entities;
using CompanyService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace CompanyService.Infrastructure.Services;

public sealed class OrganogramService(CompanyDbContext db) : IOrganogramService
{
    // Department
    public async Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync(Guid companyId) =>
        await db.Departments.AsNoTracking().Where(x => x.CompanyId == companyId)
            .Select(x => new DepartmentDto(x.Id, x.CompanyId, x.NameEn, x.NameBn))
            .ToListAsync();

    public async Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default) =>
        await db.Departments.AsNoTracking()
            .Select(x => new DepartmentDto(x.Id, x.CompanyId, x.NameEn, x.NameBn))
            .ToListAsync(cancellationToken);

    public async Task<Guid> CreateDepartmentAsync(DepartmentDto dto)
    {
        var dept = new Department { Id = Guid.NewGuid(), CompanyId = dto.CompanyId, NameEn = dto.NameEn, NameBn = dto.NameBn, CreatedAt = BusinessTime.Now };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        return dept.Id;
    }

    public async Task UpdateDepartmentAsync(DepartmentDto dto)
    {
        var dept = await db.Departments.FindAsync(dto.Id);
        if (dept == null) return;

        dept.NameEn = dto.NameEn;
        dept.NameBn = dto.NameBn;
        dept.UpdatedAt = BusinessTime.Now;

        await db.SaveChangesAsync();
    }

    public async Task DeleteDepartmentAsync(Guid id)
    {
        var dept = await db.Departments.FindAsync(id);
        if (dept == null) return;

        db.Departments.Remove(dept);
        await db.SaveChangesAsync();
    }

    // Section
    public async Task<IEnumerable<SectionDto>> GetSectionsAsync(Guid departmentId) =>
        await db.Sections.AsNoTracking().Where(x => x.DepartmentId == departmentId)
            .Select(x => new SectionDto(x.Id, x.DepartmentId, x.NameEn, x.NameBn))
            .ToListAsync();

    public async Task<IEnumerable<SectionDto>> GetAllSectionsAsync(CancellationToken cancellationToken = default) =>
        await db.Sections.AsNoTracking()
            .Select(x => new SectionDto(x.Id, x.DepartmentId, x.NameEn, x.NameBn))
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<SectionDto>> GetSectionsForCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        await db.Sections.AsNoTracking()
            .Join(
                db.Departments.AsNoTracking(),
                s => s.DepartmentId,
                d => d.Id,
                (s, d) => new { s, d })
            .Where(x => x.d.CompanyId == companyId)
            .Select(x => new SectionDto(x.s.Id, x.s.DepartmentId, x.s.NameEn, x.s.NameBn))
            .ToListAsync(cancellationToken);

    public async Task<Guid> CreateSectionAsync(SectionDto dto)
    {
        var sec = new Section { Id = Guid.NewGuid(), DepartmentId = dto.DepartmentId, NameEn = dto.NameEn, NameBn = dto.NameBn, CreatedAt = BusinessTime.Now };
        db.Sections.Add(sec);
        await db.SaveChangesAsync();
        return sec.Id;
    }

    public async Task UpdateSectionAsync(SectionDto dto)
    {
        var sec = await db.Sections.FindAsync(dto.Id);
        if (sec == null) return;

        sec.NameEn = dto.NameEn;
        sec.NameBn = dto.NameBn;
        sec.UpdatedAt = BusinessTime.Now;

        await db.SaveChangesAsync();
    }

    public async Task DeleteSectionAsync(Guid id)
    {
        var sec = await db.Sections.FindAsync(id);
        if (sec == null) return;

        db.Sections.Remove(sec);
        await db.SaveChangesAsync();
    }

    // Designation
    public async Task<IEnumerable<DesignationDto>> GetDesignationsAsync(Guid sectionId) =>
        await db.Designations.AsNoTracking().Where(x => x.SectionId == sectionId)
            .Select(x => new DesignationDto(x.Id, x.SectionId, x.NameEn, x.NameBn))
            .ToListAsync();

    public async Task<Guid> CreateDesignationAsync(DesignationDto dto)
    {
        var des = new Designation { Id = Guid.NewGuid(), SectionId = dto.SectionId, NameEn = dto.NameEn, NameBn = dto.NameBn, CreatedAt = BusinessTime.Now };
        db.Designations.Add(des);
        await db.SaveChangesAsync();
        return des.Id;
    }

    public async Task UpdateDesignationAsync(DesignationDto dto)
    {
        var des = await db.Designations.FindAsync(dto.Id);
        if (des == null) return;

        des.NameEn = dto.NameEn;
        des.NameBn = dto.NameBn;
        des.UpdatedAt = BusinessTime.Now;

        await db.SaveChangesAsync();
    }

    public async Task DeleteDesignationAsync(Guid id)
    {
        var des = await db.Designations.FindAsync(id);
        if (des == null) return;

        db.Designations.Remove(des);
        await db.SaveChangesAsync();
    }

    // Line
    public async Task<IEnumerable<LineDto>> GetLinesAsync(Guid sectionId) =>
        await db.Lines.AsNoTracking().Where(x => x.SectionId == sectionId)
            .Select(x => new LineDto(x.Id, x.SectionId, x.NameEn, x.NameBn))
            .ToListAsync();

    public async Task<Guid> CreateLineAsync(LineDto dto)
    {
        var line = new Line { Id = Guid.NewGuid(), SectionId = dto.SectionId, NameEn = dto.NameEn, NameBn = dto.NameBn, CreatedAt = BusinessTime.Now };
        db.Lines.Add(line);
        await db.SaveChangesAsync();
        return line.Id;
    }

    public async Task UpdateLineAsync(LineDto dto)
    {
        var line = await db.Lines.FindAsync(dto.Id);
        if (line == null) return;

        line.NameEn = dto.NameEn;
        line.NameBn = dto.NameBn;
        line.UpdatedAt = BusinessTime.Now;

        await db.SaveChangesAsync();
    }

    public async Task DeleteLineAsync(Guid id)
    {
        var line = await db.Lines.FindAsync(id);
        if (line == null) return;

        db.Lines.Remove(line);
        await db.SaveChangesAsync();
    }

    // Group
    public async Task<IEnumerable<GroupDto>> GetGroupsAsync(Guid? companyId = null, CancellationToken cancellationToken = default)
    {
        var q = db.Groups.AsNoTracking().AsQueryable();
        if (companyId.HasValue)
            q = q.Where(x => x.CompanyId == companyId.Value);

        return await q
            .OrderBy(x => x.NameEn)
            .Select(x => new GroupDto(x.Id, x.CompanyId, x.NameEn, x.NameBn))
            .ToListAsync(cancellationToken);
    }

    public async Task<Guid> CreateGroupAsync(GroupDto dto)
    {
        var group = new Group
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            NameEn = dto.NameEn,
            NameBn = dto.NameBn,
            CreatedAt = BusinessTime.Now,
        };
        db.Groups.Add(group);
        await db.SaveChangesAsync();
        return group.Id;
    }

    public async Task UpdateGroupAsync(GroupDto dto)
    {
        var group = await db.Groups.FindAsync(dto.Id);
        if (group == null) return;

        group.NameEn = dto.NameEn;
        group.NameBn = dto.NameBn;
        group.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync();
    }

    public async Task DeleteGroupAsync(Guid id)
    {
        var group = await db.Groups.FindAsync(id);
        if (group == null) return;

        db.Groups.Remove(group);
        await db.SaveChangesAsync();
    }

    // Floor
    public async Task<IEnumerable<FloorDto>> GetFloorsAsync(Guid? companyId = null, CancellationToken cancellationToken = default)
    {
        var q = db.Floors.AsNoTracking().AsQueryable();
        if (companyId.HasValue)
            q = q.Where(x => x.CompanyId == companyId.Value);

        return await q
            .OrderBy(x => x.NameEn)
            .Select(x => new FloorDto(x.Id, x.CompanyId, x.NameEn, x.NameBn))
            .ToListAsync(cancellationToken);
    }

    public async Task<Guid> CreateFloorAsync(FloorDto dto)
    {
        var floor = new Floor
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            NameEn = dto.NameEn,
            NameBn = dto.NameBn,
            CreatedAt = BusinessTime.Now,
        };
        db.Floors.Add(floor);
        await db.SaveChangesAsync();
        return floor.Id;
    }

    public async Task UpdateFloorAsync(FloorDto dto)
    {
        var floor = await db.Floors.FindAsync(dto.Id);
        if (floor == null) return;

        floor.NameEn = dto.NameEn;
        floor.NameBn = dto.NameBn;
        floor.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync();
    }

    public async Task DeleteFloorAsync(Guid id)
    {
        var floor = await db.Floors.FindAsync(id);
        if (floor == null) return;

        db.Floors.Remove(floor);
        await db.SaveChangesAsync();
    }
}
