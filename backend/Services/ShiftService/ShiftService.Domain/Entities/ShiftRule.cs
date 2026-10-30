namespace ShiftService.Domain.Entities;

public sealed class ShiftRule
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid ShiftId { get; set; }
    public Shift? Shift { get; set; }

    public int InGraceMinutes { get; set; }
    public int OutGraceMinutes { get; set; }
    public int LateAfterMinutes { get; set; }
    public int EarlyOutBeforeMinutes { get; set; }
    public int MinimumWorkingMinutes { get; set; }
    public int HalfDayWorkingMinutes { get; set; }

    public bool AllowOvertime { get; set; }
    public int OvertimeStartAfterMinutes { get; set; }
    public int MinimumOvertimeMinutes { get; set; }
    public int MaximumOvertimeMinutes { get; set; }

    public int LunchBreakMinutes { get; set; } = 60;
    public bool DeductLunchFromWorking { get; set; } = true;
    public bool HolidayWorkAllAsOvertime { get; set; } = true;
    public bool WeeklyOffWorkAllAsOvertime { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
