using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Common;

/// <summary>
/// Fixed punch windows used by daily attendance processing (applied to every shift).
///
/// windowInTime  = shift start − 1 hour
/// windowOutTime = windowInTime + 24 hours − 1 second
///
/// Only punches inside [windowInTime, windowOutTime] are considered. On top of that,
/// a punch only counts as OutTime when it is at/after (shift end − 5 hours), and
/// punches within 30 minutes of the InTime punch are treated as duplicate badge reads.
/// </summary>
public static class ShiftPunchWindow
{
    /// <summary>How long before the shift start punches may be used (windowInTime = ShiftStart − 1h).</summary>
    public static readonly TimeSpan InLeadMinutes = TimeSpan.FromHours(1);

    /// <summary>24-hour window length minus one second (windowOutTime = windowInTime + 24h − 1s).</summary>
    public static readonly TimeSpan Duration = TimeSpan.FromHours(24) - TimeSpan.FromSeconds(1);

    /// <summary>Only punches at/after (ShiftEnd − 5h) may be OutTime.</summary>
    public static readonly TimeSpan OutCutoffBeforeShiftEnd = TimeSpan.FromHours(5);

    /// <summary>Punches within this many minutes after the InTime punch are ignored as duplicates.</summary>
    public static readonly TimeSpan InDuplicateSkip = TimeSpan.FromMinutes(30);

    public static DateTime Start(ShiftEvaluationDto eval) => eval.ShiftStart - InLeadMinutes;

    public static DateTime End(ShiftEvaluationDto eval) => Start(eval) + Duration;

    public static DateTime OutCutoff(ShiftEvaluationDto eval) => eval.ShiftEnd - OutCutoffBeforeShiftEnd;
}
