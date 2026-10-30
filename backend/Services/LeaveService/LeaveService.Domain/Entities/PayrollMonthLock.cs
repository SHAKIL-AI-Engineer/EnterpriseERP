namespace LeaveService.Domain.Entities;

/// <summary>Materialized from PayrollLocked / PayrollUnlocked integration events.</summary>
public sealed class PayrollMonthLock
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public bool IsLocked { get; set; }
    public DateTime UpdatedAt { get; set; }
}
