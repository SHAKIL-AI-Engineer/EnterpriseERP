namespace ShiftService.Domain.Entities;

public sealed class TemporaryShiftAssignment
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ShiftId { get; set; }
    public Shift? Shift { get; set; }

    public DateTime ShiftDate { get; set; }
    public string? Reason { get; set; }

    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}
