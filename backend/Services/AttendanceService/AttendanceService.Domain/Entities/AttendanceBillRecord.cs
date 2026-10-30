namespace AttendanceService.Domain.Entities;

public sealed class AttendanceBillRecord
{
    public int Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public int PunchNumber { get; set; }
    public string EmployeeID { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string BillType { get; set; } = string.Empty;
    public DateTime BillDate { get; set; }
    public decimal Amount { get; set; }
    public int TiffinCount { get; set; }
    public string Status { get; set; } = "Processed";
    public string? ShiftName { get; set; }
    public string? CompanyName { get; set; }
    public string? InTime { get; set; }
    public string? OutTime { get; set; }
    public DateTime CreatedAt { get; set; }
}
