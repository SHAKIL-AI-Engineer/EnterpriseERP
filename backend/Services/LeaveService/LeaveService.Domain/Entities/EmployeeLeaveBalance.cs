namespace LeaveService.Domain.Entities;

public sealed class EmployeeLeaveBalance
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public int YearNo { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal EntitledDays { get; set; }
    public decimal AccruedDays { get; set; }
    public decimal UsedDays { get; set; }
    public decimal PendingDays { get; set; }
    public decimal EncashDays { get; set; }
    public decimal CarryForwardDays { get; set; }
    public decimal BalanceDays { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public LeaveType? LeaveType { get; set; }
}
