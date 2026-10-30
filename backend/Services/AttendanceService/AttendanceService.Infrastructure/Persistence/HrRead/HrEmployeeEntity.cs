namespace AttendanceService.Infrastructure.Persistence.HrRead;

public sealed class HrEmployeeEntity
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public int PunchNumber { get; set; }
    public string EmployeeID { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public bool IsOtEnabled { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class HrEmployeeJobInfoEntity
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? SectionId { get; set; }
    public Guid? DesignationId { get; set; }
    public Guid? GroupId { get; set; }
    public string? WorkLocation { get; set; }
    public bool IsCurrent { get; set; }
}

public sealed class HrDepartmentEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
}

public sealed class HrDesignationEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
}
