using ShiftService.Domain.Entities;
using ShiftService.Domain.Enums;

using Erp.BuildingBlocks.SharedKernel;

namespace ShiftService.Application.Common;

public static class ShiftPolicyTemplates
{
    public static void ApplyCategoryDefaults(Shift shift)
    {
        shift.ShiftCategory = shift.ShiftCategory switch
        {
            ShiftCategory.Night => ShiftCategory.Night,
            ShiftCategory.Day => ShiftCategory.Day,
            _ when shift.IsGeneralDuty => ShiftCategory.GeneralDuty,
            _ => shift.ShiftCategory
        };

        shift.ShiftType = shift.ShiftCategory switch
        {
            ShiftCategory.Night => "Night",
            ShiftCategory.Day => "Day",
            _ => "GeneralDuty"
        };

        shift.IsGeneralDuty = shift.ShiftCategory == ShiftCategory.GeneralDuty;
        if (shift.ShiftCategory == ShiftCategory.Night)
        {
            shift.IsCrossDay = true;
        }

        if (shift.PunchWindowBeforeMinutes <= 0)
        {
            shift.PunchWindowBeforeMinutes = 60;
        }
    }

    public static ShiftRule CreateDefaultRule(Guid companyId, Guid shiftId, ShiftCategory category)
    {
        var (late, early, otStart) = category switch
        {
            ShiftCategory.Night => (15, 5, 30),
            _ => (10, 5, 30)
        };

        return new ShiftRule
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            ShiftId = shiftId,
            InGraceMinutes = late,
            OutGraceMinutes = 5,
            LateAfterMinutes = late,
            EarlyOutBeforeMinutes = early,
            MinimumWorkingMinutes = 480,
            HalfDayWorkingMinutes = 240,
            AllowOvertime = true,
            OvertimeStartAfterMinutes = otStart,
            MinimumOvertimeMinutes = 30,
            MaximumOvertimeMinutes = 240,
            LunchBreakMinutes = 60,
            DeductLunchFromWorking = true,
            HolidayWorkAllAsOvertime = true,
            WeeklyOffWorkAllAsOvertime = true,
            CreatedAt = BusinessTime.Now
        };
    }

    public static ShiftBreak CreateDefaultLunchBreak(Guid companyId, Guid shiftId, TimeSpan shiftStart)
    {
        var lunchStart = shiftStart.Add(TimeSpan.FromHours(5));
        if (lunchStart >= TimeSpan.FromHours(24))
        {
            lunchStart = new TimeSpan(13, 0, 0);
        }

        return new ShiftBreak
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            ShiftId = shiftId,
            BreakType = BreakType.Lunch,
            BreakName = "Lunch",
            BreakStartTime = lunchStart,
            BreakEndTime = lunchStart.Add(TimeSpan.FromHours(1)),
            BreakMinutes = 60,
            IsPaidBreak = false,
            IsActive = true
        };
    }
}
