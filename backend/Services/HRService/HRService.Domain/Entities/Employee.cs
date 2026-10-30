namespace HRService.Domain.Entities;

public sealed class Employee
{
    public Guid Id { get; set; }

    /// <summary>ZKTeco BADGENUMBER / device punch number (numeric).</summary>
    public int PunchNumber { get; set; }

    /// <summary>Business employee code, e.g. EMP-0001.</summary>
    public string EmployeeID { get; set; } = string.Empty;

    public Guid CompanyId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string? BanglaName { get; set; }

    public string? Gender { get; set; }

    public string? Religion { get; set; }

    public string? BloodGroup { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? NationalId { get; set; }

    public string? BirthCertificateNo { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public DateTime JoinDate { get; set; }

    public string EmploymentType { get; set; } = string.Empty;

    public string Status { get; set; } = "Active";

    public bool IsOtEnabled { get; set; } = true;

    public string? FatherNameEn { get; set; }

    public string? FatherNameBn { get; set; }

    public string? MotherNameEn { get; set; }

    public string? MotherNameBn { get; set; }

    public string? MaritalStatus { get; set; }

    public string? SpouseNameEn { get; set; }

    public string? SpouseNameBn { get; set; }

    public string? SpouseOccupation { get; set; }

    public string? SpouseContact { get; set; }

    public string? EducationLevel { get; set; }

    public string? Institution { get; set; }

    public string? FieldOfStudy { get; set; }

    public string? Skills { get; set; }

    public string? Reference1Name { get; set; }

    public string? Reference1Relation { get; set; }

    public string? Reference1Phone { get; set; }

    public string? Reference1Address { get; set; }

    public string? Reference2Name { get; set; }

    public string? Reference2Relation { get; set; }

    public string? Reference2Phone { get; set; }

    public string? Reference2Address { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<EmployeeJobInfo> JobInfos { get; set; } = new List<EmployeeJobInfo>();
    public ICollection<EmployeeSalaryInfo> SalaryInfos { get; set; } = new List<EmployeeSalaryInfo>();
    public ICollection<EmployeeAddress> Addresses { get; set; } = new List<EmployeeAddress>();
    public ICollection<EmployeeBankAccount> BankAccounts { get; set; } = new List<EmployeeBankAccount>();
    public ICollection<EmployeeDocument> Documents { get; set; } = new List<EmployeeDocument>();
    public ICollection<EmployeeEmergencyContact> EmergencyContacts { get; set; } = new List<EmployeeEmergencyContact>();
}
