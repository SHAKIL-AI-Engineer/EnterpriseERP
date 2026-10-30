namespace LeaveService.Domain.Entities;

public sealed class LeaveApplication
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public decimal TotalDays { get; set; }
    public bool IsHalfDay { get; set; }
    public string? HalfDayType { get; set; }
    public string? Reason { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid AppliedBy { get; set; }
    public DateTime AppliedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? AttachmentUrl { get; set; }

    public LeaveType? LeaveType { get; set; }
    public ICollection<LeaveApprovalStep> ApprovalSteps { get; set; } = new List<LeaveApprovalStep>();
}
