namespace LeaveService.Domain.Entities;

public sealed class LeaveEncashment
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public int YearNo { get; set; }
    public decimal EncashDays { get; set; }
    public decimal RatePerDay { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid? RequestedBy { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public LeaveType? LeaveType { get; set; }
}
