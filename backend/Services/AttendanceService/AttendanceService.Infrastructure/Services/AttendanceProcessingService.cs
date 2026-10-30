using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;

namespace AttendanceService.Infrastructure.Services;

public class AttendanceProcessingService : IAttendanceProcessingService
{
    public DailyAttendance Process(
        DailyAttendance record,
        IReadOnlyList<AttendancePunchInput> punches,
        ShiftEvaluationDto eval,
        bool isOtEnabled = true)
    {
        ApplyPunchTimes(record, punches, eval);

        record.ShiftId = eval.ShiftId == Guid.Empty ? null : eval.ShiftId;
        record.ShiftName = eval.ShiftName;

        var policy = eval.Policy;
        var shiftStart = eval.ShiftStart;
        var shiftEnd = eval.ShiftEnd;

        record.DayType = eval.IsHoliday ? DayType.Holiday
            : eval.IsWeeklyOff ? DayType.WeeklyOff
            : DayType.WorkingDay;

        record.LateMinutes = 0;
        record.EarlyOutMinutes = 0;
        record.OTMinutes = 0;
        record.WorkingMinutes = 0;
        record.BreakMinutes = 0;
        record.Remarks = null;

        if (!record.InTime.HasValue && !record.OutTime.HasValue)
        {
            record.Status = eval.IsHoliday
                ? AttendanceStatus.Holiday
                : eval.IsWeeklyOff
                    ? AttendanceStatus.WeeklyOff
                    : AttendanceStatus.Absent;
            return record;
        }

        if (record.InTime.HasValue && !record.OutTime.HasValue)
        {
            record.Remarks = "OUT punch not recorded";
            record.LateMinutes = CalcLate(record.InTime.Value, shiftStart, policy);
            record.Status = record.LateMinutes > 0 ? AttendanceStatus.Late : AttendanceStatus.Present;
            return record;
        }

        if (!record.InTime.HasValue && record.OutTime.HasValue)
        {
            record.Remarks = "IN punch not recorded";
            record.EarlyOutMinutes = CalcEarlyOut(record.OutTime.Value, shiftEnd, policy);
            record.Status = record.EarlyOutMinutes > 0 ? AttendanceStatus.EarlyOut : AttendanceStatus.Present;
            return record;
        }

        var rawMinutes = (int)(record.OutTime!.Value - record.InTime!.Value).TotalMinutes;
        var lunch = policy.DeductLunchFromWorking ? policy.LunchBreakMinutes : 0;
        record.BreakMinutes = lunch;

        if (eval.IsHoliday || eval.IsWeeklyOff)
        {
            // Working on a weekend/holiday counts as full overtime whenever the
            // employee's OT status is enabled.
            record.WorkingMinutes = Math.Max(0, rawMinutes - lunch);
            record.OvertimeMinutes = isOtEnabled ? record.WorkingMinutes : 0;
            record.Status = eval.IsHoliday ? AttendanceStatus.HolidayPresent : AttendanceStatus.WeeklyOffPresent;
            return record;
        }

        // Early departure — the out punch is before (shift end − 5 hours). It must not be
        // treated as a normal full-day out with overtime; classify it via the half-day /
        // early-out rules instead. Lunch is not deducted because the span does not cover
        // the full break period.
        if (record.OutTime!.Value < ShiftPunchWindow.OutCutoff(eval))
        {
            record.BreakMinutes = 0;
            record.LateMinutes = CalcLate(record.InTime!.Value, shiftStart, policy);
            record.EarlyOutMinutes = (int)(shiftEnd - record.OutTime.Value).TotalMinutes;
            record.WorkingMinutes = Math.Max(0, rawMinutes);
            record.OvertimeMinutes = 0;
            record.Status = record.WorkingMinutes >= policy.HalfDayWorkingMinutes
                ? AttendanceStatus.HalfDay
                : AttendanceStatus.EarlyOut;
            record.Remarks = "Early departure";
            return record;
        }

        record.LateMinutes = CalcLate(record.InTime!.Value, shiftStart, policy);
        record.EarlyOutMinutes = CalcEarlyOut(record.OutTime!.Value, shiftEnd, policy);
        record.OvertimeMinutes = isOtEnabled
            ? CalcOvertime(record.OutTime!.Value, shiftEnd, policy, eval)
            : 0;

        var netWorking = rawMinutes - lunch;
        if (record.OvertimeMinutes > 0)
        {
            netWorking -= record.OvertimeMinutes;
        }

        record.WorkingMinutes = Math.Max(0, netWorking);

        if (record.LateMinutes > 0)
        {
            record.Status = AttendanceStatus.Late;
        }
        else if (record.EarlyOutMinutes > 0)
        {
            record.Status = AttendanceStatus.EarlyOut;
        }
        else
        {
            record.Status = AttendanceStatus.Present;
        }

        return record;
    }

    private static int CalcLate(DateTime inTime, DateTime shiftStart, ShiftPolicyDto policy)
    {
        var threshold = shiftStart.AddMinutes(policy.LateAfterMinutes);
        if (inTime <= threshold) return 0;
        return (int)(inTime - shiftStart).TotalMinutes;
    }

    private static int CalcEarlyOut(DateTime outTime, DateTime shiftEnd, ShiftPolicyDto policy)
    {
        var threshold = shiftEnd.AddMinutes(-policy.EarlyOutBeforeMinutes);
        if (outTime >= threshold) return 0;
        return (int)(shiftEnd - outTime).TotalMinutes;
    }

    private static int CalcOvertime(DateTime outTime, DateTime shiftEnd, ShiftPolicyDto policy, ShiftEvaluationDto eval)
    {
        if (!policy.AllowOvertime) return 0;

        if (IsGeneralDutyDayShift(eval))
        {
            // General duty day shift: overtime starts exactly at shift end, so a 17:45 out
            // on an 08:00–17:00 shift yields 45 OT minutes, which the fixed-hour bucket
            // rule (OvertimeHourRules) reports as 1 hour. General duty stays uncapped.
            var generalDutyOt = (int)(outTime - shiftEnd).TotalMinutes;
            return generalDutyOt >= policy.MinimumOvertimeMinutes ? generalDutyOt : 0;
        }

        var threshold = shiftEnd.AddMinutes(policy.OvertimeStartAfterMinutes);
        if (outTime <= threshold) return 0;
        var ot = (int)(outTime - shiftEnd).TotalMinutes;
        if (ot < policy.MinimumOvertimeMinutes) return 0;
        if (policy.MaximumOvertimeMinutes > 0)
        {
            ot = Math.Min(ot, policy.MaximumOvertimeMinutes);
        }

        return ot;
    }

    private static void ApplyPunchTimes(
        DailyAttendance record,
        IReadOnlyList<AttendancePunchInput> punches,
        ShiftEvaluationDto eval)
    {
        // Only punches inside [windowInTime, windowOutTime] are considered.
        //   windowInTime  = shift start − 1 hour
        //   windowOutTime = windowInTime + 24 hours − 1 second
        var windowStart = ShiftPunchWindow.Start(eval);
        var windowEnd = ShiftPunchWindow.End(eval);

        var inWindow = punches
            .Where(p => p.PunchTime >= windowStart && p.PunchTime <= windowEnd)
            .OrderBy(p => p.PunchTime)
            .ToList();

        if (inWindow.Count == 0)
        {
            if (!record.IsManualIn)
            {
                record.InTime = null;
                record.InPunchId = null;
            }

            if (!record.IsManualOut)
            {
                record.OutTime = null;
                record.OutPunchId = null;
            }

            return;
        }

        // InTime — the FIRST punch before the shift start; if the employee arrived
        // late (no pre-shift punch) fall back to the first punch inside the window.
        // A first punch that is already at/after (shift end − 5 hours) is a punch-out
        // without a punch-in (e.g. an evening-only badge read) and must not be used as
        // InTime: it is only counted as OutTime with InTime left missing.
        if (!record.IsManualIn)
        {
            var firstBeforeShift = inWindow.Find(p => p.PunchTime < eval.ShiftStart);
            if (firstBeforeShift is not null)
            {
                ApplyInPunch(record, firstBeforeShift);
            }
            else if (inWindow[0].PunchTime < ShiftPunchWindow.OutCutoff(eval))
            {
                ApplyInPunch(record, inWindow[0]);
            }
            else
            {
                record.InTime = null;
                record.InPunchId = null;
            }
        }

        // The InTime punch is consumed as IN only. Any punch within 30 minutes after it is
        // a duplicate badge read and is ignored; only later punches may be OutTime.
        var inTime = record.InTime;
        var remaining = inTime.HasValue
            ? inWindow
                .Where(p => p.PunchTime > inTime.Value.Add(ShiftPunchWindow.InDuplicateSkip))
                .ToList()
            : inWindow;

        // OutTime — the LAST punch at/after (shift end − 5 hours).
        // For non-cross-day shifts, prefer the last candidate on the attendance date so a
        // stray next-morning punch (e.g. 05-08 03:58) cannot replace the real departure
        // (e.g. 17:45). When no same-day candidate exists (overnight attendance), the last
        // candidate in the window is used.
        // If every post-debounce punch is before the cutoff, the employee left early: the
        // actual out is recorded and Process() classifies it as half-day / early-out instead
        // of a normal full-day out with overtime.
        if (!record.IsManualOut)
        {
            var cutoff = ShiftPunchWindow.OutCutoff(eval);
            var outCandidates = remaining.Where(p => p.PunchTime >= cutoff).ToList();

            AttendancePunchInput? outPunch = null;
            if (outCandidates.Count > 0)
            {
                if (!eval.IsCrossDay)
                {
                    var sameDay = outCandidates
                        .Where(p => p.PunchTime.Date == record.AttendanceDate.Date)
                        .ToList();
                    outPunch = sameDay.Count > 0 ? sameDay[^1] : outCandidates[^1];
                }
                else
                {
                    outPunch = outCandidates[^1];
                }
            }
            else if (remaining.Count > 0)
            {
                outPunch = remaining[^1];
            }

            if (outPunch is not null)
                ApplyOutPunch(record, outPunch);
            else
            {
                record.OutTime = null;
                record.OutPunchId = null;
            }
        }
    }

    private static void ApplyInPunch(DailyAttendance record, AttendancePunchInput punch)
    {
        record.InTime = punch.PunchTime;
        record.InPunchId = punch.PunchRecordId;
    }

    private static void ApplyOutPunch(DailyAttendance record, AttendancePunchInput punch)
    {
        record.OutTime = punch.PunchTime;
        record.OutPunchId = punch.PunchRecordId;
    }

    private static bool IsGeneralDutyDayShift(ShiftEvaluationDto eval) =>
        !eval.IsCrossDay
        && string.Equals(eval.ShiftCategory, "GeneralDuty", StringComparison.OrdinalIgnoreCase);
}
