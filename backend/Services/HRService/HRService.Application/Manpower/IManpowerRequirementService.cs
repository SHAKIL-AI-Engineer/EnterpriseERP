using Erp.BuildingBlocks.Contracts.Pagination;

namespace HRService.Application.Manpower;

public interface IManpowerRequirementService
{
    Task<Guid> CreateAsync(CreateManpowerRequirementDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateManpowerRequirementDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ManpowerRequirementDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<ManpowerRequirementDto>> ListAsync(ManpowerRequirementQuery query, CancellationToken cancellationToken = default);
    Task<IEnumerable<ManpowerRequirementSummaryDto>> GetSummaryAsync(Guid companyId, CancellationToken cancellationToken = default);
}

public sealed record CreateManpowerRequirementDto(
    Guid CompanyId, Guid DepartmentId, Guid DesignationId, 
    int RequiredNumber, DateTime RequestDate, DateTime? ExpectedJoiningDate,
    string? Remarks);

public sealed record UpdateManpowerRequirementDto(
    Guid DepartmentId, Guid DesignationId, 
    int RequiredNumber, DateTime RequestDate, DateTime? ExpectedJoiningDate,
    string Status, string? Remarks);

public sealed record ManpowerRequirementDto(
    Guid Id, Guid CompanyId, Guid DepartmentId, string? DepartmentName,
    Guid DesignationId, string? DesignationName, int RequiredNumber,
    DateTime RequestDate, DateTime? ExpectedJoiningDate, string Status, string? Remarks);

public sealed record ManpowerRequirementSummaryDto(
    Guid DepartmentId, string? DepartmentName,
    Guid DesignationId, string? DesignationName,
    int ApprovedCount, int PendingCount, int OnboardCount, int GapCount);

public class ManpowerRequirementQuery : PagedRequest
{
    public Guid? CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? Status { get; set; }
}
