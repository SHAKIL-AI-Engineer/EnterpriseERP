using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Common;

/// <summary>
/// Keeps stale day-shift evaluations from using next-day windows, except for GeneralDuty
/// shifts where a 24-hour window is now intentional.
/// </summary>
public static class ShiftEvaluationNormalizer
{
    public static ShiftEvaluationDto Normalize(ShiftEvaluationDto eval)
    {
        if (eval.IsCrossDay || IsGeneralDutyDayShift(eval))
        {
            return eval;
        }

        var day = eval.AttendanceDate.Date;
        if (eval.PunchWindowEnd.Date <= day)
        {
            return eval;
        }

        var windowEnd = eval.ShiftEnd.AddMinutes(
            Math.Max(0, eval.Policy.OutGraceMinutes) + Math.Max(0, eval.Policy.MaximumOvertimeMinutes));
        var windowStart = eval.ShiftStart.AddMinutes(
            -Math.Max(60, eval.Policy.InGraceMinutes));

        return eval with
        {
            PunchWindowEnd = windowEnd,
            PunchWindowStart = windowStart < eval.PunchWindowStart ? windowStart : eval.PunchWindowStart,
        };
    }

    private static bool IsGeneralDutyDayShift(ShiftEvaluationDto eval) =>
        !eval.IsCrossDay
        && string.Equals(eval.ShiftCategory, "GeneralDuty", StringComparison.OrdinalIgnoreCase);
}
