namespace LeaveService.Domain.Entities;

public sealed class LeavePolicy
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public decimal YearlyEntitlement { get; set; }
    public decimal MonthlyAccrual { get; set; }
    public int MinServiceMonths { get; set; }
    public decimal? MaxConsecutiveDays { get; set; }
    public bool RequiresApproval { get; set; } = true;
    public bool AllowHalfDay { get; set; }
    public bool AllowNegativeBalance { get; set; }
    /// <summary>When true, holidays in range do not add to leave day count.</summary>
    public bool ExcludeHolidaysFromLeaveDays { get; set; } = true;
    /// <summary>When true, weekly off days in range do not add to leave day count.</summary>
    public bool ExcludeWeeklyOffFromLeaveDays { get; set; } = true;
    public int ApprovalLevelCount { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public LeaveType? LeaveType { get; set; }
}
