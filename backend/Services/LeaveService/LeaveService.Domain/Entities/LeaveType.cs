namespace LeaveService.Domain.Entities;

public sealed class LeaveType
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string LeaveCode { get; set; } = string.Empty;
    public string LeaveName { get; set; } = string.Empty;
    public bool IsPaid { get; set; } = true;
    public bool IsCarryForward { get; set; }
    public decimal MaxCarryForwardDays { get; set; }
    public bool IsEncashable { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
