using AttendanceService.Application.Common;
using AttendanceService.Application.DTOs;
using Xunit;

namespace AttendanceService.Tests;

public sealed class ShiftEvaluationNormalizerTests
{
    [Fact]
    public void GeneralDutyDayShift_KeepsNextDayTwentyFourHourWindow()
    {
        var date = new DateTime(2026, 5, 21);
        var eval = CreateEvaluation(date, "GeneralDuty", date.AddHours(7), date.AddDays(1).AddHours(6).AddMinutes(59));

        var normalized = ShiftEvaluationNormalizer.Normalize(eval);

        Assert.Equal(new DateTime(2026, 5, 21, 7, 0, 0), normalized.PunchWindowStart);
        Assert.Equal(new DateTime(2026, 5, 22, 6, 59, 0), normalized.PunchWindowEnd);
    }

    [Fact]
    public void NonGeneralDayShift_ClampsNextDayWindowToSameDay()
    {
        var date = new DateTime(2026, 5, 9);
        var eval = CreateEvaluation(date, "Day", date.AddHours(8), date.AddDays(1).AddHours(7).AddMinutes(59));

        var normalized = ShiftEvaluationNormalizer.Normalize(eval);

        Assert.Equal(date.Date, normalized.PunchWindowEnd.Date);
        Assert.Equal(new DateTime(2026, 5, 9, 22, 5, 0), normalized.PunchWindowEnd);
    }

    private static ShiftEvaluationDto CreateEvaluation(
        DateTime date,
        string shiftCategory,
        DateTime punchWindowStart,
        DateTime punchWindowEnd)
    {
        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            true, 30, 30, 240, 60, true, true, true);

        return new ShiftEvaluationDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            date,
            Guid.Empty,
            "General",
            shiftCategory,
            date.AddHours(9),
            date.AddHours(18),
            IsCrossDay: false,
            punchWindowStart,
            punchWindowEnd,
            "WorkingDay",
            false,
            false,
            false,
            policy);
    }
}
