using ShiftService.Domain.Enums;

namespace ShiftService.Domain.Entities;

public sealed class ShiftBreak
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid ShiftId { get; set; }
    public Shift? Shift { get; set; }

    public BreakType BreakType { get; set; } = BreakType.Lunch;
    public string BreakName { get; set; } = string.Empty;
    public TimeSpan BreakStartTime { get; set; }
    public TimeSpan BreakEndTime { get; set; }
    public int BreakMinutes { get; set; }
    public bool IsPaidBreak { get; set; }
    public bool IsActive { get; set; } = true;
}
