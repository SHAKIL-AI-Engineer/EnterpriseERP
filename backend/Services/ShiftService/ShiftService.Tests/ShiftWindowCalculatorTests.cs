using ShiftService.Application.Common;
using ShiftService.Domain.Entities;
using ShiftService.Domain.Enums;
using Xunit;

namespace ShiftService.Tests;

public class ShiftWindowCalculatorTests
{
    [Fact]
    public void GeneralDutyDayShift_WindowRunsTwentyFourHoursFromWindowStart()
    {
        var shift = new Shift
        {
            StartTime = new TimeSpan(8, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            PunchWindowBeforeMinutes = 60,
            IsCrossDay = false,
            IsGeneralDuty = true,
            ShiftCategory = ShiftCategory.GeneralDuty,
        };
        var date = new DateTime(2026, 5, 21);

        var (start, end) = ShiftWindowCalculator.GetPunchWindow(date, shift, outGraceMinutes: 5, maximumOvertimeMinutes: 240);

        Assert.Equal(new DateTime(2026, 5, 21, 7, 0, 0), start);
        Assert.Equal(new DateTime(2026, 5, 22, 6, 59, 0), end);
    }

    [Fact]
    public void NonGeneralDayShift_WindowEndsSameDayAfterGraceAndOt()
    {
        var shift = new Shift
        {
            StartTime = new TimeSpan(8, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            PunchWindowBeforeMinutes = 60,
            IsCrossDay = false,
            IsGeneralDuty = false,
            ShiftCategory = ShiftCategory.Day,
        };
        var date = new DateTime(2026, 5, 21);

        var (start, end) = ShiftWindowCalculator.GetPunchWindow(date, shift, outGraceMinutes: 5, maximumOvertimeMinutes: 240);

        Assert.Equal(new DateTime(2026, 5, 21, 7, 0, 0), start);
        Assert.Equal(new DateTime(2026, 5, 21, 21, 5, 0), end);
        Assert.True(end.Date == date.Date);
    }

    [Fact]
    public void NonGeneralDayShift_WindowExcludesNextCalendarMorning()
    {
        var shift = new Shift
        {
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(18, 0, 0),
            PunchWindowBeforeMinutes = 60,
            IsCrossDay = false,
            IsGeneralDuty = false,
            ShiftCategory = ShiftCategory.Day,
        };
        var date = new DateTime(2026, 5, 2);
        var (_, windowEnd) = ShiftWindowCalculator.GetPunchWindow(date, shift, 5, 240);

        var nextMorningIn = new DateTime(2026, 5, 3, 7, 53, 0);
        Assert.True(nextMorningIn > windowEnd);
    }

    [Fact]
    public void CrossDayShift_PunchWindowEndsBeforeNextDayWindowStart()
    {
        var shift = new Shift
        {
            StartTime = new TimeSpan(20, 0, 0),
            EndTime = new TimeSpan(8, 0, 0),
            PunchWindowBeforeMinutes = 60,
            IsCrossDay = true,
            ShiftCategory = ShiftCategory.Night,
        };
        var date = new DateTime(2026, 5, 21);

        var (start, end) = ShiftWindowCalculator.GetPunchWindow(date, shift);

        Assert.Equal(new DateTime(2026, 5, 21, 19, 0, 0), start);
        Assert.Equal(new DateTime(2026, 5, 22, 18, 59, 0), end);
    }

    [Fact]
    public void CrossDayShift_EndIsNextMorning()
    {
        var shift = new Shift
        {
            StartTime = new TimeSpan(20, 0, 0),
            EndTime = new TimeSpan(8, 0, 0),
            PunchWindowBeforeMinutes = 60,
            IsCrossDay = true,
            ShiftCategory = ShiftCategory.Night,
        };
        var date = new DateTime(2026, 5, 21);

        var (shiftStart, shiftEnd) = ShiftWindowCalculator.GetShiftBounds(date, shift);

        Assert.Equal(new DateTime(2026, 5, 21, 20, 0, 0), shiftStart);
        Assert.Equal(new DateTime(2026, 5, 22, 8, 0, 0), shiftEnd);
    }
}
