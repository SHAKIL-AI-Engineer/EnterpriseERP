namespace CompanyService.Application.Organogram;

public interface IOrganogramService
{
    // Department
    Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync(Guid companyId);
    Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateDepartmentAsync(DepartmentDto dto);
    Task UpdateDepartmentAsync(DepartmentDto dto);
    Task DeleteDepartmentAsync(Guid id);

    // Section
    Task<IEnumerable<SectionDto>> GetSectionsAsync(Guid departmentId);
    Task<IEnumerable<SectionDto>> GetAllSectionsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<SectionDto>> GetSectionsForCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<Guid> CreateSectionAsync(SectionDto dto);
    Task UpdateSectionAsync(SectionDto dto);
    Task DeleteSectionAsync(Guid id);

    // Designation
    Task<IEnumerable<DesignationDto>> GetDesignationsAsync(Guid sectionId);
    Task<Guid> CreateDesignationAsync(DesignationDto dto);
    Task UpdateDesignationAsync(DesignationDto dto);
    Task DeleteDesignationAsync(Guid id);

    // Line
    Task<IEnumerable<LineDto>> GetLinesAsync(Guid sectionId);
    Task<Guid> CreateLineAsync(LineDto dto);
    Task UpdateLineAsync(LineDto dto);
    Task DeleteLineAsync(Guid id);

    // Group
    Task<IEnumerable<GroupDto>> GetGroupsAsync(Guid? companyId = null, CancellationToken cancellationToken = default);
    Task<Guid> CreateGroupAsync(GroupDto dto);
    Task UpdateGroupAsync(GroupDto dto);
    Task DeleteGroupAsync(Guid id);

    // Floor
    Task<IEnumerable<FloorDto>> GetFloorsAsync(Guid? companyId = null, CancellationToken cancellationToken = default);
    Task<Guid> CreateFloorAsync(FloorDto dto);
    Task UpdateFloorAsync(FloorDto dto);
    Task DeleteFloorAsync(Guid id);
}

public record DepartmentDto(Guid? Id, Guid CompanyId, string NameEn, string NameBn);
public record SectionDto(Guid? Id, Guid DepartmentId, string NameEn, string NameBn);
public record DesignationDto(Guid? Id, Guid SectionId, string NameEn, string NameBn);
public record LineDto(Guid? Id, Guid SectionId, string NameEn, string NameBn);
public record GroupDto(Guid? Id, Guid CompanyId, string NameEn, string NameBn);
public record FloorDto(Guid? Id, Guid CompanyId, string NameEn, string NameBn);
