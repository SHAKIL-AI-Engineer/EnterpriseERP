using ShiftService.Domain.Entities;
using ShiftService.Domain.Enums;

namespace ShiftService.Application.Common;

public static class ShiftWindowCalculator
{
    public static (DateTime ShiftStart, DateTime ShiftEnd) GetShiftBounds(DateTime attendanceDate, Shift shift)
    {
        var shiftStart = attendanceDate.Date.Add(shift.StartTime);
        var shiftEnd = attendanceDate.Date.Add(shift.EndTime);

        if (shift.IsCrossDay || shift.EndTime <= shift.StartTime)
        {
            shiftEnd = shiftEnd.AddDays(1);
        }

        return (shiftStart, shiftEnd);
    }

    /// <summary>
    /// Punch collection window for one attendance date.
    /// General duty day shifts use a 24-hour window from the pre-shift window start.
    /// Other day shifts end at shift end + out grace + max OT.
    /// Cross-day shifts extend through the next pre-shift buffer so OUT can be next morning.
    /// </summary>
    public static (DateTime WindowStart, DateTime WindowEnd) GetPunchWindow(
        DateTime attendanceDate,
        Shift shift,
        int outGraceMinutes = 5,
        int maximumOvertimeMinutes = 240)
    {
        var (shiftStart, shiftEnd) = GetShiftBounds(attendanceDate, shift);
        var before = TimeSpan.FromMinutes(shift.PunchWindowBeforeMinutes > 0 ? shift.PunchWindowBeforeMinutes : 60);
        var windowStart = shiftStart.Subtract(before);

        if (shift.IsCrossDay || shift.EndTime <= shift.StartTime)
        {
            var nextDayStart = attendanceDate.Date.AddDays(1).Add(shift.StartTime).Subtract(before);
            return (windowStart, nextDayStart.AddMinutes(-1));
        }

        if (IsGeneralDutyDayShift(shift))
        {
            return (windowStart, windowStart.AddDays(1).AddMinutes(-1));
        }

        var afterEnd = Math.Max(0, outGraceMinutes) + Math.Max(0, maximumOvertimeMinutes);
        var windowEnd = shiftEnd.AddMinutes(afterEnd);
        return (windowStart, windowEnd);
    }

    private static bool IsGeneralDutyDayShift(Shift shift) =>
        !shift.IsCrossDay
        && shift.EndTime > shift.StartTime
        && (shift.IsGeneralDuty || shift.ShiftCategory == ShiftCategory.GeneralDuty);
}
