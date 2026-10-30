using Erp.BuildingBlocks.Contracts.Pagination;

namespace HRService.Application.Employees;

public interface IEmployeeReadService
{
    Task<PaginatedList<EmployeeListItemDto>> ListAsync(EmployeeListQuery query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeListItemDto>> ListByIdsAsync(IReadOnlyList<Guid> ids, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeLookupDto>> ListLookupsByIdsAsync(
        IReadOnlyList<Guid> ids,
        Guid? companyId = null,
        CancellationToken cancellationToken = default);
    Task<EmployeeDetailsDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PaginatedList<ManpowerListItemDto>> ManpowerListAsync(ManpowerListQuery query, CancellationToken cancellationToken = default);
    Task<ManpowerSummaryDto> ManpowerSummaryAsync(ManpowerSummaryQuery query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeStatusHistoryDto>> GetStatusHistoryAsync(Guid employeeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeTransferDto>> GetEmployeeTransfersAsync(Guid employeeId, CancellationToken cancellationToken = default);
    Task<PaginatedList<EmployeeTransferDto>> ListTransfersAsync(EmployeeTransferListQuery query, CancellationToken cancellationToken = default);
}

public class EmployeeTransferListQuery : PagedRequest
{
    public Guid? CompanyId { get; set; }
    public Guid? EmployeeId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public class EmployeeListQuery : PagedRequest
{
    public Guid? CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? SectionId { get; set; }
    public Guid? DesignationId { get; set; }
    public string? Status { get; set; }
    public string? Gender { get; set; }
    public string? Religion { get; set; }
    public string? EmployeeId { get; set; }
    public DateTime? JoinDateFrom { get; set; }
    public DateTime? JoinDateTo { get; set; }
}

public class ManpowerListQuery : EmployeeListQuery;

public class ManpowerSummaryQuery : ManpowerListQuery;

public sealed class ManpowerSummaryDto
{
    public int TotalEmployees { get; init; }
    public int ActiveEmployees { get; init; }
    public int OnLeaveEmployees { get; init; }
    public int InactiveEmployees { get; init; }
    public IReadOnlyList<SummaryBucketDto> DepartmentSummary { get; init; } = [];
    public IReadOnlyList<SummaryBucketDto> DesignationSummary { get; init; } = [];
    public IReadOnlyList<SummaryBucketDto> GenderSummary { get; init; } = [];
    public IReadOnlyList<SummaryBucketDto> StatusSummary { get; init; } = [];
}

public sealed class SummaryBucketDto
{
    public Guid? Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public int Count { get; init; }
    public decimal Percentage { get; init; }
}

public sealed class EmployeeLookupDto
{
    public Guid Id { get; init; }
    public string EmployeeCode { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? DepartmentName { get; init; }
    public string? DesignationName { get; init; }
}

public sealed class EmployeeListItemDto
{
    public Guid Id { get; init; }
    public int PunchNumber { get; init; }
    public string EmployeeID { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public Guid CompanyId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Gender { get; init; }
    public string? Religion { get; init; }
    public string? BloodGroup { get; init; }
    public bool IsOtEnabled { get; init; }
    public DateTime JoinDate { get; init; }
    public string? Phone { get; init; }
    public string? DesignationName { get; init; }
    public string? DepartmentName { get; init; }
}

public sealed class ManpowerListItemDto
{
    public Guid Id { get; init; }
    public int PunchNumber { get; init; }
    public string EmployeeID { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? DesignationName { get; init; }
    public string? DepartmentName { get; init; }
    public string? SectionName { get; init; }
    public DateTime JoinDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? Religion { get; init; }
    public string? BloodGroup { get; init; }
    public bool IsOtEnabled { get; init; }
    public decimal GrossSalary { get; init; }
}

public sealed class EmployeeDetailsDto
{
    public Guid Id { get; init; }
    public Guid CompanyId { get; init; }
    public int PunchNumber { get; init; }
    public string EmployeeID { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? BanglaName { get; init; }
    public string? Gender { get; init; }
    public string? Religion { get; init; }
    public string? BloodGroup { get; init; }
    public DateTime? DateOfBirth { get; init; }
    public string? NationalId { get; init; }
    public string? BirthCertificateNo { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public DateTime JoinDate { get; init; }
    public string EmploymentType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public bool IsOtEnabled { get; init; }

    public string? FatherNameEn { get; init; }
    public string? FatherNameBn { get; init; }
    public string? MotherNameEn { get; init; }
    public string? MotherNameBn { get; init; }
    public string? MaritalStatus { get; init; }
    public string? SpouseNameEn { get; init; }
    public string? SpouseNameBn { get; init; }
    public string? SpouseOccupation { get; init; }
    public string? SpouseContact { get; init; }
    public string? EducationLevel { get; init; }
    public string? Institution { get; init; }
    public string? FieldOfStudy { get; init; }
    public string? Skills { get; init; }
    public string? Reference1Name { get; init; }
    public string? Reference1Relation { get; init; }
    public string? Reference1Phone { get; init; }
    public string? Reference1Address { get; init; }
    public string? Reference2Name { get; init; }
    public string? Reference2Relation { get; init; }
    public string? Reference2Phone { get; init; }
    public string? Reference2Address { get; init; }

    public EmployeeJobInfoDto? CurrentJobInfo { get; init; }
    public EmployeeSalaryInfoDto? CurrentSalaryInfo { get; init; }
    public IReadOnlyList<EmployeeAddressItemDto> Addresses { get; init; } = [];
    public IReadOnlyList<EmployeeBankAccountItemDto> BankAccounts { get; init; } = [];
    public IReadOnlyList<EmergencyContactItemDto> EmergencyContacts { get; init; } = [];
    public IReadOnlyList<EmployeeDocumentItemDto> Documents { get; init; } = [];
}

public sealed record EmployeeAddressItemDto(
    Guid Id, string AddressType, string Country, string? Division, string? District,
    string? Upazila, string? PostOffice, string? PostalCode, string? AddressLine);

public sealed record EmployeeBankAccountItemDto(
    Guid Id, string? BankName, string? BranchName, string? AccountNo, string? RoutingNo,
    string? MobileBankingType, string? MobileBankingNo, bool IsPrimary);

public sealed record EmergencyContactItemDto(
    Guid Id, string ContactName, string? Relation, string Phone, string? Address);

public sealed record EmployeeDocumentItemDto(
    Guid Id, string DocumentType, string FileUrl, DateTime UploadedAt);

public sealed record EmployeeStatusHistoryDto(
    Guid Id, string Status, DateTime EffectiveFrom, string? Remarks, DateTimeOffset CreatedAt);

/// <summary>Transfer list row. Uses EmployeeEntityId + EmployeeCode (not EmployeeId/EmployeeID) to avoid JSON name collisions.</summary>
public sealed class EmployeeTransferDto
{
    public Guid Id { get; init; }
    public Guid EmployeeEntityId { get; init; }
    public string EmployeeCode { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public Guid? FromDepartmentId { get; init; }
    public string? FromDepartmentName { get; init; }
    public Guid? ToDepartmentId { get; init; }
    public string? ToDepartmentName { get; init; }
    public DateTime EffectiveDate { get; init; }
    public string? Reason { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
}

public record EmployeeJobInfoDto(
    Guid? DepartmentId, string? DepartmentName,
    Guid? SectionId, string? SectionName,
    Guid? DesignationId, string? DesignationName,
    Guid? GradeId, string? GradeName,
    Guid? SupervisorId, string? SupervisorName,
    string? WorkLocation, DateTime EffectiveFrom,
    Guid? GroupId = null, string? GroupName = null);

public record EmployeeSalaryInfoDto(
    decimal BasicSalary, decimal HouseRent, decimal MedicalAllowance,
    decimal ConveyanceAllowance, decimal FoodAllowance, decimal GrossSalary,
    DateTime EffectiveFrom);
