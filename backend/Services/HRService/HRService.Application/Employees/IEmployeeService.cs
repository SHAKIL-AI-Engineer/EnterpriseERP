namespace HRService.Application.Employees;

public interface IEmployeeService
{
    // Core Employee CRUD
    Task<Guid> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    // Job & Status Management
    Task TransferAsync(Guid id, TransferEmployeeDto dto, CancellationToken cancellationToken = default);
    Task ChangeStatusAsync(Guid id, ChangeStatusDto dto, CancellationToken cancellationToken = default);
    Task UpdateSalaryAsync(Guid id, UpdateSalaryDto dto, CancellationToken cancellationToken = default);

    // Sub-Entity Management
    Task AddAddressAsync(Guid employeeId, EmployeeAddressDto dto, CancellationToken cancellationToken = default);
    Task UpdateAddressAsync(Guid addressId, EmployeeAddressDto dto, CancellationToken cancellationToken = default);
    Task DeleteAddressAsync(Guid addressId, CancellationToken cancellationToken = default);

    Task AddBankAccountAsync(Guid employeeId, EmployeeBankAccountDto dto, CancellationToken cancellationToken = default);
    Task UpdateBankAccountAsync(Guid bankAccountId, EmployeeBankAccountDto dto, CancellationToken cancellationToken = default);
    Task DeleteBankAccountAsync(Guid bankAccountId, CancellationToken cancellationToken = default);

    Task AddEmergencyContactAsync(Guid employeeId, EmergencyContactDto dto, CancellationToken cancellationToken = default);
    Task UpdateEmergencyContactAsync(Guid contactId, EmergencyContactDto dto, CancellationToken cancellationToken = default);
    Task DeleteEmergencyContactAsync(Guid contactId, CancellationToken cancellationToken = default);

    Task AddDocumentAsync(Guid employeeId, EmployeeDocumentDto dto, CancellationToken cancellationToken = default);
    Task DeleteDocumentAsync(Guid documentId, CancellationToken cancellationToken = default);
}

// DTOs
public sealed record CreateEmployeeDto(
    Guid CompanyId, int PunchNumber, string? EmployeeID, string FullName, string? BanglaName,
    string? Gender, DateTime? DateOfBirth, string? NationalId, string? BirthCertificateNo,
    string? Phone, string? Email, DateTime JoinDate, string EmploymentType,
    Guid? DepartmentId, Guid? SectionId, Guid? DesignationId, Guid? GradeId,
    decimal BasicSalary, decimal HouseRent, decimal MedicalAllowance, decimal ConveyanceAllowance, decimal FoodAllowance,
    string? Religion = null, string? BloodGroup = null, Guid? GroupId = null,
    string? FatherNameEn = null, string? FatherNameBn = null, string? MotherNameEn = null, string? MotherNameBn = null,
    string? MaritalStatus = null, string? SpouseNameEn = null, string? SpouseNameBn = null,
    string? SpouseOccupation = null, string? SpouseContact = null,
    string? EducationLevel = null, string? Institution = null, string? FieldOfStudy = null, string? Skills = null,
    string? Reference1Name = null, string? Reference1Relation = null, string? Reference1Phone = null, string? Reference1Address = null,
    string? Reference2Name = null, string? Reference2Relation = null, string? Reference2Phone = null, string? Reference2Address = null,
    bool IsOtEnabled = true, string? WorkLocation = null);

public sealed record UpdateEmployeeDto(
    string FullName, string? BanglaName, string? Gender, DateTime? DateOfBirth,
    string? NationalId, string? BirthCertificateNo, string? Phone, string? Email,
    DateTime JoinDate, string EmploymentType, string Status,
    string? Religion = null, string? BloodGroup = null,
    string? FatherNameEn = null, string? FatherNameBn = null, string? MotherNameEn = null, string? MotherNameBn = null,
    string? MaritalStatus = null, string? SpouseNameEn = null, string? SpouseNameBn = null,
    string? SpouseOccupation = null, string? SpouseContact = null,
    string? EducationLevel = null, string? Institution = null, string? FieldOfStudy = null, string? Skills = null,
    string? Reference1Name = null, string? Reference1Relation = null, string? Reference1Phone = null, string? Reference1Address = null,
    string? Reference2Name = null, string? Reference2Relation = null, string? Reference2Phone = null, string? Reference2Address = null,
    bool IsOtEnabled = true,
    decimal BasicSalary = 0, decimal HouseRent = 0, decimal MedicalAllowance = 0,
    decimal ConveyanceAllowance = 0, decimal FoodAllowance = 0);

public sealed record TransferEmployeeDto(
    Guid? DepartmentId, Guid? SectionId, Guid? DesignationId, Guid? GradeId,
    Guid? SupervisorId, string? WorkLocation, string? Reason, DateTime EffectiveFrom,
    Guid? GroupId = null);

public sealed record ChangeStatusDto(string Status, DateTime EffectiveFrom, string? Remarks);

public sealed record UpdateSalaryDto(
    decimal BasicSalary, decimal HouseRent, decimal MedicalAllowance,
    decimal ConveyanceAllowance, decimal FoodAllowance, DateTime EffectiveFrom);

public sealed record EmployeeAddressDto(
    string AddressType, string Country, string? Division, string? District,
    string? Upazila, string? PostOffice, string? PostalCode, string? AddressLine);

public sealed record EmployeeBankAccountDto(
    string? BankName, string? BranchName, string? AccountNo, string? RoutingNo,
    string? MobileBankingType, string? MobileBankingNo, bool IsPrimary);

public sealed record EmergencyContactDto(
    string ContactName, string? Relation, string Phone, string? Address);

public sealed record EmployeeDocumentDto(string DocumentType, string FileUrl);
