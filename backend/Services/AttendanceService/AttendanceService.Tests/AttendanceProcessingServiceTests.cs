using AttendanceService.Application.Common;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using AttendanceService.Infrastructure.Services;
using Erp.BuildingBlocks.SharedKernel;
using Xunit;

namespace AttendanceService.Tests;

public class AttendanceProcessingServiceTests
{
    private readonly AttendanceProcessingService _service = new();

    [Fact]
    public void DayShift_AssignsMorningInAndEveningOut()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(48);
        var evening = date.AddHours(17).AddMinutes(9);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(evening)],
            eval);

        Assert.Equal(morning, record.InTime);
        Assert.Equal(evening, record.OutTime);
        Assert.True(record.LateMinutes < 120);
    }

    [Fact]
    public void DayShift_SavesSelectedPunchRecordIds()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(48);
        var evening = date.AddHours(17).AddMinutes(9);
        var inPunchId = Guid.NewGuid();
        var outPunchId = Guid.NewGuid();
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning, inPunchId), new AttendancePunchInput(evening, outPunchId)],
            eval);

        Assert.Equal(inPunchId, record.InPunchId);
        Assert.Equal(outPunchId, record.OutPunchId);
    }

    [Fact]
    public void DayShift_DoesNotSwapWhenChronologicalOrderWouldBeWrong()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(53);
        var evening = date.AddHours(17).AddMinutes(9);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(evening), new AttendancePunchInput(morning)],
            eval);

        Assert.Equal(morning, record.InTime);
        Assert.Equal(evening, record.OutTime);
    }

    [Fact]
    public void GeneralDutyDayShift_UsesNextMorningPunchAsOutAndCalculatesUncappedOt()
    {
        var date = new DateTime(2026, 5, 21);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(55);
        var nextMorningOut = date.AddDays(1).AddHours(6);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(nextMorningOut)],
            eval);

        Assert.Equal(morning, record.InTime);
        Assert.Equal(nextMorningOut, record.OutTime);
        Assert.Equal(780, record.OvertimeMinutes);
    }

    [Fact]
    public void GeneralDutyDayShift_OtBelowMinimumReturnsZero()
    {
        var date = new DateTime(2026, 5, 21);
        var eval = CreateGeneralDayShiftEval(date);
        var morning = date.AddHours(7).AddMinutes(55);
        var outTime = date.AddHours(17).AddMinutes(20);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(outTime)],
            eval);

        Assert.Equal(0, record.OvertimeMinutes);
    }

    [Fact]
    public void GeneralDutyDayShift_OvertimeDisabledReturnsZero()
    {
        var date = new DateTime(2026, 5, 21);
        var eval = CreateGeneralDayShiftEval(date, allowOvertime: false);
        var morning = date.AddHours(7).AddMinutes(55);
        var nextMorningOut = date.AddDays(1).AddHours(6);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(nextMorningOut)],
            eval);

        Assert.Equal(0, record.OvertimeMinutes);
    }

    [Fact]
    public void EmployeeOtDisabled_ReturnsZeroOvertimeEvenWhenShiftAllows()
    {
        var date = new DateTime(2026, 5, 21);
        var eval = CreateGeneralDayShiftEval(date, allowOvertime: true);
        var morning = date.AddHours(7).AddMinutes(55);
        var nextMorningOut = date.AddDays(1).AddHours(6);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(nextMorningOut)],
            eval,
            isOtEnabled: false);

        Assert.Equal(0, record.OvertimeMinutes);
    }

    [Fact]
    public void EmployeeOtDisabled_WeeklyOffFullOtPolicy_ReturnsZeroOvertime()
    {
        var date = new DateTime(2026, 5, 8);
        var eval = CreateWeeklyOffEval(date, fullOt: true);
        var morning = date.AddHours(7).AddMinutes(30);
        var evening = date.AddHours(13).AddMinutes(5);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(evening)],
            eval,
            isOtEnabled: false);

        Assert.Equal(AttendanceStatus.WeeklyOffPresent, record.Status);
        Assert.Equal(0, record.OvertimeMinutes);
        Assert.True(record.WorkingMinutes > 0);
    }

    [Fact]
    public void CrossDayShift_UsesFirstInLastOut()
    {
        var date = new DateTime(2026, 5, 2);
        var evening = date.AddHours(20).AddMinutes(5);
        var nextMorning = date.AddDays(1).AddHours(7).AddMinutes(50);
        var eval = CreateNightCrossDayEval(date);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(evening), new AttendancePunchInput(nextMorning)],
            eval);

        Assert.Equal(evening, record.InTime);
        Assert.Equal(nextMorning, record.OutTime);
    }

    [Fact]
    public void WeeklyOff_NoPunches_MarksWeeklyOffNotAbsent()
    {
        var date = new DateTime(2026, 5, 1);
        var eval = CreateWeeklyOffEval(date);
        var record = NewRecord(date);

        _service.Process(record, [], eval);

        Assert.Equal(DayType.WeeklyOff, record.DayType);
        Assert.Equal(AttendanceStatus.WeeklyOff, record.Status);
        Assert.Equal(0, record.OvertimeMinutes);
        Assert.Null(record.InTime);
        Assert.Null(record.OutTime);
    }

    [Fact]
    public void WeeklyOff_WithPunchesAndFullOtPolicy_MarksWeeklyOffPresentWithOvertime()
    {
        var date = new DateTime(2026, 5, 8);
        var eval = CreateWeeklyOffEval(date, fullOt: true);
        var morning = date.AddHours(7).AddMinutes(30);
        var evening = date.AddHours(13).AddMinutes(5);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(evening)],
            eval);

        Assert.Equal(DayType.WeeklyOff, record.DayType);
        Assert.Equal(AttendanceStatus.WeeklyOffPresent, record.Status);
        Assert.True(record.OvertimeMinutes > 0);
        Assert.Equal(record.WorkingMinutes, record.OvertimeMinutes);
    }

    // ── Boundary-based punch classification ──────────────────────────────────

    [Fact]
    public void DayShift_MultiplePunchesBeforeShiftStart_ShowsOnlyInTime()
    {
        // Many early taps (e.g. double-swipe at gate before shift) → InTime = first, no OutTime.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var first  = date.AddHours(7).AddMinutes(40);
        var second = date.AddHours(7).AddMinutes(50);
        var third  = date.AddHours(7).AddMinutes(55);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(first), new AttendancePunchInput(second), new AttendancePunchInput(third)],
            eval);

        Assert.Equal(first, record.InTime);
        Assert.Null(record.OutTime);
    }

    [Fact]
    public void DayShift_MultiplePunchesAfterShiftEnd_AllWithinThirtyMinutes_CountAsOutOnly()
    {
        // No pre-shift punch and every swipe is at/after (shift end − 5h) → InTime stays
        // missing and the latest punch is OutTime; the swipes within 30 minutes of each
        // other are duplicate reads that do not create an InTime.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var first  = date.AddHours(17).AddMinutes(10);
        var second = date.AddHours(17).AddMinutes(20);
        var last   = date.AddHours(17).AddMinutes(30);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(first), new AttendancePunchInput(second), new AttendancePunchInput(last)],
            eval);

        Assert.Null(record.InTime);
        Assert.Equal(last, record.OutTime);
    }

    [Fact]
    public void DayShift_SinglePunchAfterShiftEnd_CountsAsOutOnly()
    {
        // A single punch at/after (shift end − 5h) is a punch-out without a punch-in:
        // InTime stays missing and the punch is recorded as OutTime.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var latePunch = date.AddHours(17).AddMinutes(15);
        var record = NewRecord(date);

        _service.Process(record, [new AttendancePunchInput(latePunch)], eval);

        Assert.Null(record.InTime);
        Assert.Equal(latePunch, record.OutTime);
    }

    [Fact]
    public void DayShift_PunchesOnBothSides_PicksFirstBeforeAndLastAfter()
    {
        // Multiple pre-shift AND post-shift punches → InTime = earliest pre-shift, OutTime = latest post-shift.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var earlyFirst  = date.AddHours(7).AddMinutes(40);
        var earlySecond = date.AddHours(7).AddMinutes(52);
        var lateFirst   = date.AddHours(17).AddMinutes(15);
        var lateLast    = date.AddHours(17).AddMinutes(40);
        var record = NewRecord(date);

        _service.Process(
            record,
            [
                new AttendancePunchInput(earlyFirst),
                new AttendancePunchInput(earlySecond),
                new AttendancePunchInput(lateFirst),
                new AttendancePunchInput(lateLast),
            ],
            eval);

        Assert.Equal(earlyFirst, record.InTime);
        Assert.Equal(lateLast, record.OutTime);
    }

    [Fact]
    public void WorkingDay_NoPunches_RemainsAbsent()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var record = NewRecord(date);

        _service.Process(record, [], eval);

        Assert.Equal(DayType.WorkingDay, record.DayType);
        Assert.Equal(AttendanceStatus.Absent, record.Status);
    }

    [Fact]
    public void Holiday_NoPunches_MarksHolidayNotAbsent()
    {
        var date = new DateTime(2026, 5, 3);
        var eval = CreateHolidayEval(date);
        var record = NewRecord(date);

        _service.Process(record, [], eval);

        Assert.Equal(DayType.Holiday, record.DayType);
        Assert.Equal(AttendanceStatus.Holiday, record.Status);
    }

    // ── Window-based rules (windowIn = shiftStart − 1h, windowOut = windowIn + 24h − 1s) ──

    [Fact]
    public void PunchesOutsidePunchWindow_AreIgnored()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var tooEarly = date.AddHours(6).AddMinutes(30); // before windowIn (07:00)
        var record = NewRecord(date);

        _service.Process(record, [new AttendancePunchInput(tooEarly)], eval);

        Assert.Null(record.InTime);
        Assert.Null(record.OutTime);
        Assert.Equal(AttendanceStatus.Absent, record.Status);
    }

    [Fact]
    public void LateArrival_NoPreshiftPunch_UsesFirstInWindowAsInTime()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var lateIn = date.AddHours(9); // after shift start
        var outTime = date.AddHours(17).AddMinutes(30);
        var record = NewRecord(date);

        _service.Process(record, [new AttendancePunchInput(lateIn), new AttendancePunchInput(outTime)], eval);

        Assert.Equal(lateIn, record.InTime);
        Assert.Equal(outTime, record.OutTime);
        Assert.True(record.LateMinutes > 0);
    }

    [Fact]
    public void HolidayWork_CountsFullOvertimeWhenEmployeeOtEnabled_EvenWithoutPolicyFlag()
    {
        var date = new DateTime(2026, 5, 3);
        var eval = CreateHolidayEval(date, fullOt: false);
        var morning = date.AddHours(7).AddMinutes(30);
        var evening = date.AddHours(13).AddMinutes(5);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(evening)],
            eval,
            isOtEnabled: true);

        Assert.Equal(AttendanceStatus.HolidayPresent, record.Status);
        Assert.True(record.OvertimeMinutes > 0);
        Assert.Equal(record.WorkingMinutes, record.OvertimeMinutes);
    }

    [Fact]
    public void HolidayWork_NoOvertimeWhenEmployeeOtDisabled()
    {
        var date = new DateTime(2026, 5, 3);
        var eval = CreateHolidayEval(date, fullOt: true);
        var morning = date.AddHours(7).AddMinutes(30);
        var evening = date.AddHours(13).AddMinutes(5);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(morning), new AttendancePunchInput(evening)],
            eval,
            isOtEnabled: false);

        Assert.Equal(AttendanceStatus.HolidayPresent, record.Status);
        Assert.Equal(0, record.OvertimeMinutes);
        Assert.True(record.WorkingMinutes > 0);
    }

    [Fact]
    public void DayShift_NextMorningStrayPunch_DoesNotReplaceValidEveningOut()
    {
        // Spec Section 20 / Acceptance B: a next-morning punch inside the window must not
        // replace the already determined valid evening OutTime.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var record = NewRecord(date);

        _service.Process(
            record,
            [
                new AttendancePunchInput(date.AddHours(7).AddMinutes(52)),
                new AttendancePunchInput(date.AddHours(7).AddMinutes(55)),
                new AttendancePunchInput(date.AddHours(8).AddMinutes(5)),
                new AttendancePunchInput(date.AddHours(8).AddMinutes(15)),
                new AttendancePunchInput(date.AddHours(16).AddMinutes(30)),
                new AttendancePunchInput(date.AddHours(17).AddMinutes(45)),
                new AttendancePunchInput(date.AddDays(1).AddHours(3).AddMinutes(58)),
            ],
            eval);

        Assert.Equal(date.AddHours(7).AddMinutes(52), record.InTime);
        Assert.Equal(date.AddHours(17).AddMinutes(45), record.OutTime);
        Assert.Equal(45, record.OvertimeMinutes);
    }

    [Fact]
    public void DayShift_NextMorningPunch_BecomesOutWhenNoSameDayOut()
    {
        // Spec Section 2 / Acceptance C: with only a morning in and a next-morning out,
        // the next-morning punch is the OutTime (it belongs to the 24-hour window).
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var record = NewRecord(date);
        var nextMorning = date.AddDays(1).AddHours(3).AddMinutes(58);

        _service.Process(
            record,
            [new AttendancePunchInput(date.AddHours(7).AddMinutes(52)), new AttendancePunchInput(nextMorning)],
            eval);

        Assert.Equal(date.AddHours(7).AddMinutes(52), record.InTime);
        Assert.Equal(nextMorning, record.OutTime);
    }

    [Fact]
    public void DayShift_EarlyDeparture_UnderHalfDay_MarksEarlyOut_NoOvertime()
    {
        // Spec Section 10 / Acceptance G: 11:30 is before shiftEnd − 5h (12:00), so it is
        // an early-out candidate, not a normal full-day out. Worked < HalfDayWorkingMinutes.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(date.AddHours(7).AddMinutes(52)), new AttendancePunchInput(date.AddHours(11).AddMinutes(30))],
            eval);

        Assert.Equal(date.AddHours(7).AddMinutes(52), record.InTime);
        Assert.Equal(date.AddHours(11).AddMinutes(30), record.OutTime);
        Assert.Equal(AttendanceStatus.EarlyOut, record.Status);
        Assert.Equal(0, record.OvertimeMinutes);
    }

    [Fact]
    public void DayShift_EarlyDeparture_AtLeastHalfDay_MarksHalfDay_NoOvertime()
    {
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(date.AddHours(7)), new AttendancePunchInput(date.AddHours(11).AddMinutes(50))],
            eval);

        Assert.Equal(date.AddHours(7), record.InTime);
        Assert.Equal(date.AddHours(11).AddMinutes(50), record.OutTime);
        Assert.Equal(AttendanceStatus.HalfDay, record.Status);
        Assert.Equal(0, record.OvertimeMinutes);
    }

    [Fact]
    public void GeneralDutyDayShift_FortyFiveMinuteOvertime_FeedsBucketRuleAsOneHour()
    {
        // Spec Section 16 / Acceptance A: 17:45 out on an 08:00–17:00 shift is 45 OT
        // minutes, stored as minutes; OvertimeHourRules reports it as 1 hour.
        var date = new DateTime(2026, 5, 2);
        var eval = CreateGeneralDayShiftEval(date);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(date.AddHours(7).AddMinutes(52)), new AttendancePunchInput(date.AddHours(17).AddMinutes(45))],
            eval);

        Assert.Equal(date.AddHours(7).AddMinutes(52), record.InTime);
        Assert.Equal(date.AddHours(17).AddMinutes(45), record.OutTime);
        Assert.Equal(45, record.OvertimeMinutes);
        Assert.Equal(1, OvertimeHourRules.ConvertMinutesToHours(record.OvertimeMinutes));
    }

    [Fact]
    public void DayShift_EveningOnlyPunches_CountAsOutWithMissingIn()
    {
        var date = new DateTime(2026, 7, 8);
        var eval = CreateGeneralDayShiftEval(date);
        var firstEvening = date.AddHours(17).AddMinutes(12).AddSeconds(57);
        var lastEvening = date.AddHours(17).AddMinutes(15).AddSeconds(4);
        var record = NewRecord(date);

        _service.Process(
            record,
            [new AttendancePunchInput(firstEvening), new AttendancePunchInput(lastEvening)],
            eval);

        Assert.Null(record.InTime);
        Assert.Equal(lastEvening, record.OutTime);
        Assert.NotEqual(AttendanceStatus.Absent, record.Status);
    }

    [Fact]
    public void DayShift_SinglePunchInOutZone_CountsAsOutWithMissingIn()
    {
        var date = new DateTime(2026, 7, 8);
        var eval = CreateGeneralDayShiftEval(date);
        var outPunch = date.AddHours(13);
        var record = NewRecord(date);

        _service.Process(record, [new AttendancePunchInput(outPunch)], eval);

        Assert.Null(record.InTime);
        Assert.Equal(outPunch, record.OutTime);
        Assert.Equal(AttendanceStatus.EarlyOut, record.Status);
    }

    [Fact]
    public void DayShift_MidMorningLatePunch_StillCountsAsIn()
    {
        var date = new DateTime(2026, 7, 8);
        var eval = CreateGeneralDayShiftEval(date);
        var lateIn = date.AddHours(11);
        var record = NewRecord(date);

        _service.Process(record, [new AttendancePunchInput(lateIn)], eval);

        Assert.Equal(lateIn, record.InTime);
        Assert.Null(record.OutTime);
        Assert.Equal(AttendanceStatus.Late, record.Status);
    }

    private static DailyAttendance NewRecord(DateTime date) =>
        new()
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            EmployeeId = Guid.NewGuid(),
            AttendanceDate = date,
        };

    private static ShiftEvaluationDto CreateGeneralDayShiftEval(DateTime date, bool allowOvertime = true)
    {
        var start = date.AddHours(8);
        var end = date.AddHours(17);
        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            allowOvertime, 30, 30, 240, 60, true, true, true);
        var windowStart = start.AddHours(-1);

        return new ShiftEvaluationDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            date,
            Guid.NewGuid(),
            "General",
            "GeneralDuty",
            start,
            end,
            IsCrossDay: false,
            windowStart,
            windowStart.AddDays(1).AddMinutes(-1),
            "WorkingDay",
            false,
            false,
            false,
            policy);
    }

    private static ShiftEvaluationDto CreateHolidayEval(DateTime date, bool fullOt = true)
    {
        var start = date.AddHours(8);
        var end = date.AddHours(17);
        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            true, 30, 30, 240, 60, true, true, fullOt);

        return new ShiftEvaluationDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            date,
            Guid.NewGuid(),
            "General",
            "GeneralDuty",
            start,
            end,
            IsCrossDay: false,
            start.AddHours(-1),
            start.AddDays(1).AddMinutes(-1),
            "Holiday",
            IsWeeklyOff: false,
            IsHoliday: true,
            IsOffDayWorkEligibleForFullOt: fullOt,
            policy);
    }

    private static ShiftEvaluationDto CreateWeeklyOffEval(DateTime date, bool fullOt = true)
    {
        var start = date.AddHours(8);
        var end = date.AddHours(17);
        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            true, 30, 30, 240, 60, true, true, fullOt);

        return new ShiftEvaluationDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            date,
            Guid.NewGuid(),
            "General",
            "GeneralDuty",
            start,
            end,
            IsCrossDay: false,
            start.AddHours(-1),
            start.AddDays(1).AddMinutes(-1),
            "WeeklyOff",
            IsWeeklyOff: true,
            IsHoliday: false,
            IsOffDayWorkEligibleForFullOt: fullOt,
            policy);
    }

    private static ShiftEvaluationDto CreateNightCrossDayEval(DateTime date)
    {
        var start = date.AddHours(20);
        var end = date.AddDays(1).AddHours(8);
        var policy = new ShiftPolicyDto(
            Guid.Empty, Guid.Empty, 10, 5, 10, 5, 480, 240,
            true, 30, 30, 240, 60, true, true, true);

        return new ShiftEvaluationDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            date,
            Guid.NewGuid(),
            "Night",
            "Night",
            start,
            end,
            IsCrossDay: true,
            start.AddHours(-1),
            date.AddDays(1).AddHours(19).AddMinutes(59),
            "WorkingDay",
            false,
            false,
            false,
            policy);
    }
}
