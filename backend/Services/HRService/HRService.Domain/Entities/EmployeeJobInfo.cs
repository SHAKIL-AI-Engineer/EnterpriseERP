namespace HRService.Domain.Entities;

public sealed class EmployeeJobInfo
{
    public Guid Id { get; set; }

    public Guid EmployeeId { get; set; }

    public Employee? Employee { get; set; }

    public Guid CompanyId { get; set; }

    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public Guid? SectionId { get; set; }

    public Guid? DesignationId { get; set; }
    public Designation? Designation { get; set; }

    public Guid? GradeId { get; set; }
    public Grade? Grade { get; set; }

    /// <summary>Functional group from Company Service organogram (Staff, Worker, etc.).</summary>
    public Guid? GroupId { get; set; }

    public Guid? SupervisorId { get; set; }

    public string? WorkLocation { get; set; }

    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    public bool IsCurrent { get; set; } = true;
}
