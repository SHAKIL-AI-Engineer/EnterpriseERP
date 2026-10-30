namespace LeaveService.Domain.Entities;

public sealed class LeaveApprovalStep
{
    public Guid Id { get; set; }
    public Guid LeaveApplicationId { get; set; }
    public int ApprovalLevel { get; set; }
    public Guid? ApproverUserId { get; set; }
    public Guid? ApproverEmployeeId { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Remarks { get; set; }
    public DateTime? ActionAt { get; set; }

    public LeaveApplication? LeaveApplication { get; set; }
}
