namespace HRService.Application.Employees;

/// <summary>Flat employee row for Excel import/export round-trip (column order matches template).</summary>
public sealed class EmployeeImportRowDto
{
    public int RowIndex { get; init; }
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
    public string EmploymentType { get; init; } = "Permanent";
    public string Status { get; init; } = "Active";
    public bool IsOtEnabled { get; init; } = true;

    public string? DepartmentName { get; init; }
    public string? SectionName { get; init; }
    public string? DesignationName { get; init; }
    public string? GradeName { get; init; }
    public string? GroupName { get; init; }
    public string? LineName { get; init; }
    public string? SupervisorEmployeeID { get; init; }

    public decimal BasicSalary { get; init; }
    public decimal HouseRent { get; init; }
    public decimal MedicalAllowance { get; init; }
    public decimal ConveyanceAllowance { get; init; }
    public decimal FoodAllowance { get; init; }

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

    public string? PresentDivision { get; init; }
    public string? PresentDistrict { get; init; }
    public string? PresentUpazila { get; init; }
    public string? PresentPostOffice { get; init; }
    public string? PresentPostalCode { get; init; }
    public string? PresentAddress { get; init; }
    public string? PermanentDivision { get; init; }
    public string? PermanentDistrict { get; init; }
    public string? PermanentUpazila { get; init; }
    public string? PermanentPostOffice { get; init; }
    public string? PermanentPostalCode { get; init; }
    public string? PermanentAddress { get; init; }

    public string? BankName { get; init; }
    public string? BranchName { get; init; }
    public string? AccountNo { get; init; }
    public string? RoutingNo { get; init; }
    public string? BankAccountType { get; init; }
    public string? MobileBankingNo { get; init; }

    public string? EmergencyContactName { get; init; }
    public string? EmergencyContactRelation { get; init; }
    public string? EmergencyContactPhone { get; init; }
    public string? EmergencyContactAddress { get; init; }

    public string? ProfileImageUrl { get; init; }
    public string? SignatureImageUrl { get; init; }
}

public sealed record EmployeeImportUpsertRequest(IReadOnlyList<EmployeeImportRowDto> Rows);

public sealed class EmployeeImportUpsertResult
{
    public int Created { get; init; }
    public int Updated { get; init; }
    public int Failed { get; init; }
    public IReadOnlyList<EmployeeImportRowError> Errors { get; init; } = [];
}

public sealed record EmployeeImportRowError(int RowIndex, string Field, string Message);

public sealed record EmployeePlacementResolution(
    Guid DepartmentId,
    Guid? SectionId,
    Guid DesignationId,
    Guid? GradeId,
    Guid? GroupId,
    Guid? SupervisorId,
    string? WorkLocation);
