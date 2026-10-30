namespace LeaveService.Domain.Entities;

public sealed class EarnLeavePolicy
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public string CalculationType { get; set; } = "WorkingDaysBased";
    public decimal DaysWorkedForOneEarnLeave { get; set; } = 18;
    public decimal MaxEarnLeavePerYear { get; set; }
    public bool IsEncashable { get; set; } = true;
    public bool IsCarryForward { get; set; } = true;
    public bool IsActive { get; set; } = true;

    public LeaveType? LeaveType { get; set; }
}
