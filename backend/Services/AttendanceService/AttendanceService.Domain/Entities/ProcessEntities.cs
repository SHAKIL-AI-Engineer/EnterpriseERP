using AttendanceService.Domain.Enums;

namespace AttendanceService.Domain.Entities;

public sealed class AttendanceProcessBatch
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public DateTime ProcessFromDate { get; set; }
    public DateTime ProcessToDate { get; set; }
    public int TotalEmployees { get; set; }
    public int ProcessedEmployees { get; set; }
    public int FailedEmployees { get; set; }
    public ProcessStatus ProcessStatus { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? ProcessedBy { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
}

public sealed class AttendanceProcessError
{
    public Guid Id { get; set; }
    public Guid BatchId { get; set; }
    public Guid CompanyId { get; set; }
    public Guid? EmployeeId { get; set; }
    public DateTime AttendanceDate { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
