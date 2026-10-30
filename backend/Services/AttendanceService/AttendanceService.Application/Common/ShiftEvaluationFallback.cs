using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Common;

public static class ShiftEvaluationFallback
{
    public static ShiftEvaluationDto Create(Guid companyId, Guid employeeId, DateTime attendanceDate)
    {
        var date = attendanceDate.Date;
        var start = date.AddHours(9);
        var end = date.AddHours(18);

        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            true, 30, 30, 240, 60, true, true, true);

        var windowStart = start.AddHours(-1);
        var windowEnd = windowStart.AddDays(1).AddMinutes(-1);

        return new ShiftEvaluationDto(
            companyId, employeeId, date, Guid.Empty, "General", "GeneralDuty",
            start, end, false, windowStart, windowEnd,
            "WorkingDay", false, false, false, policy);
    }
}
