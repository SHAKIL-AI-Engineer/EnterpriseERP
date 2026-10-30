using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using Erp.BuildingBlocks.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Infrastructure.Services;

public sealed class DailyAttendanceProcessOrchestrator(
    IAttendanceDbContext db,
    IShiftServiceClient shiftClient,
    IAttendanceProcessingService processingService,
    IPunchRecordReader punchRecordReader,
    IEmployeeDirectory employeeDirectory,
    IPunchCompanyIdResolver punchCompanyIdResolver) : IDailyAttendanceProcessOrchestrator
{
    private const int SqlParameterChunkSize = 1000;

    public async Task<ProcessDailyAttendanceResult> ProcessDayAsync(
        Guid companyId,
        DateTime date,
        IReadOnlyList<string>? employeeIDs = null,
        CancellationToken cancellationToken = default)
    {
        var punchCompanyId = punchCompanyIdResolver.Resolve(companyId);
        if (punchCompanyId is null or <= 0)
        {
            throw new InvalidOperationException(
                $"No PunchData company mapping for company {companyId}. " +
                "Set PunchData:CompanyIdByGuid or PunchData:DefaultCompanyId in configuration.");
        }

        var processDate = AttendanceDateRange.ToCalendarDate(date);

        IReadOnlyList<PunchRecordRow> punchRows;
        try
        {
            punchRows = await punchRecordReader.GetForCompanyAndRangeAsync(
                punchCompanyId.Value,
                processDate,
                processDate.AddDays(2),
                cancellationToken);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to read punch data for company {punchCompanyId} on {processDate:yyyy-MM-dd}. {ex.Message}",
                ex);
        }

        var employees = await employeeDirectory.ListByCompanyAsync(companyId, cancellationToken);
        if (employees.Count == 0)
        {
            throw new InvalidOperationException($"No active employees found for company {companyId}.");
        }

        if (employeeIDs is { Count: > 0 })
        {
            var filterTokens = employeeIDs
                .Select(e => e.Trim())
                .Where(e => e.Length > 0)
                .ToList();
            employees = employees
                .Where(e => filterTokens.Any(token => EmployeeFilterMatcher.Matches(e, token)))
                .ToList();
            if (employees.Count == 0)
            {
                throw new InvalidOperationException("No employees matched the provided EmployeeIDs filter.");
            }
        }

        var punchesByNumber = punchRows
            .Where(p => p.PunchNumber > 0)
            .GroupBy(p => p.PunchNumber)
            .ToDictionary(g => g.Key, g => g.ToList());

        var employeePlans = await BuildEmployeePlansAsync(
            companyId,
            processDate,
            employees,
            punchesByNumber,
            cancellationToken);

        var employeeIds = employeePlans
            .Select(p => p.Employee.Id)
            .ToList();

        var existingAttendances = await GetCurrentAttendancesAsync(
            companyId,
            processDate,
            employeeIds,
            cancellationToken);

        var claimedPunchIdsByEmployee = await GetClaimedPunchIdsByEmployeeAsync(
            companyId,
            processDate,
            employeePlans,
            cancellationToken);

        var existingDeviceLogs = await GetExistingDeviceLogsAsync(
            companyId,
            employeeIds,
            employeePlans.Min(p => ShiftPunchWindow.Start(p.Evaluation)),
            employeePlans.Max(p => ShiftPunchWindow.End(p.Evaluation)),
            cancellationToken);

        var createdCount = 0;
        var updatedCount = 0;
        var skippedLockedCount = 0;
        var presentCount = 0;
        var absentCount = 0;
        var lateCount = 0;

        foreach (var plan in employeePlans)
        {
            var employee = plan.Employee;
            var evaluation = plan.Evaluation;
            var dayPunchRows = plan.PunchRows;
            claimedPunchIdsByEmployee.TryGetValue(employee.Id, out var claimedPunchIds);
            claimedPunchIds ??= [];

            dayPunchRows = dayPunchRows
                .Where(p => p.PunchTime >= ShiftPunchWindow.Start(evaluation) && p.PunchTime <= ShiftPunchWindow.End(evaluation))
                .Where(p => !claimedPunchIds.Contains(p.Id))
                .OrderBy(p => p.PunchTime)
                .ToList();

            existingAttendances.TryGetValue(employee.Id, out var attendance);

            if (attendance is { IsPayrollLocked: true } or { IsApproved: true })
            {
                skippedLockedCount++;
                continue;
            }

            var punchInputs = dayPunchRows
                .Select(p => new AttendancePunchInput(p.PunchTime, p.Id))
                .ToList();

            var isNew = false;
            AttendanceSnapshot? before = null;
            if (attendance is null)
            {
                isNew = true;
                attendance = new DailyAttendance
                {
                    Id = Guid.NewGuid(),
                    CompanyId = companyId,
                    EmployeeId = employee.Id,
                    PunchNumber = employee.PunchNumber,
                    EmployeeID = employee.EmployeeID,
                    AttendanceDate = processDate,
                    CreatedAt = BusinessTime.NowOffset,
                };
            }
            else
            {
                before = AttendanceSnapshot.Create(attendance);
                attendance.PunchNumber = employee.PunchNumber;
                attendance.EmployeeID = employee.EmployeeID;
            }

            processingService.Process(attendance, punchInputs, evaluation, employee.IsOtEnabled);

            if (isNew)
            {
                db.DailyAttendances.Add(attendance);
                createdCount++;
            }
            else if (before is not null && before.HasChanged(attendance))
            {
                attendance.UpdatedAt = BusinessTime.NowOffset;
                updatedCount++;
            }
            else
            {
                MarkUnchanged(attendance);
            }

            SyncDeviceLogsInWindow(
                companyId,
                employee,
                ShiftPunchWindow.Start(evaluation),
                ShiftPunchWindow.End(evaluation),
                dayPunchRows,
                existingDeviceLogs);

            switch (attendance.Status)
            {
                case AttendanceStatus.Absent:
                    absentCount++;
                    break;
                case AttendanceStatus.Late:
                    lateCount++;
                    presentCount++;
                    break;
                case AttendanceStatus.Present:
                case AttendanceStatus.EarlyOut:
                case AttendanceStatus.HolidayPresent:
                case AttendanceStatus.WeeklyOffPresent:
                    presentCount++;
                    break;
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        return new ProcessDailyAttendanceResult(
            employees.Count,
            presentCount,
            absentCount,
            lateCount,
            createdCount,
            updatedCount,
            skippedLockedCount);
    }

    private async Task<IReadOnlyList<EmployeeProcessPlan>> BuildEmployeePlansAsync(
        Guid companyId,
        DateTime processDate,
        IReadOnlyList<EmployeeDirectoryEntry> employees,
        IReadOnlyDictionary<int, List<PunchRecordRow>> punchesByNumber,
        CancellationToken cancellationToken)
    {
        var plans = new EmployeeProcessPlan[employees.Count];

        var employeeIds = employees.Select(e => e.Id).ToList();
        var evaluations = await GetEvaluationsByEmployeeAsync(
            companyId,
            processDate,
            employeeIds,
            cancellationToken);

        var nextDayCandidates = evaluations
            .Where(kv => IsGeneralDutyDayShift(kv.Value)
                && kv.Value.PunchWindowEnd.Date > processDate.Date
                && !string.Equals(kv.Value.AssignmentSource, "Temporary", StringComparison.OrdinalIgnoreCase))
            .Select(kv => kv.Key)
            .ToList();

        var nextDayEvaluations = nextDayCandidates.Count == 0
            ? new Dictionary<Guid, ShiftEvaluationDto>()
            : await GetEvaluationsByEmployeeAsync(
                companyId,
                processDate.AddDays(1),
                nextDayCandidates,
                cancellationToken);

        for (var index = 0; index < employees.Count; index++)
        {
            var employee = employees[index];
            punchesByNumber.TryGetValue(employee.PunchNumber, out var dayPunchRows);
            dayPunchRows = dayPunchRows is null ? [] : [.. dayPunchRows];

            if (!evaluations.TryGetValue(employee.Id, out var evaluation))
            {
                evaluation = ShiftEvaluationFallback.Create(companyId, employee.Id, processDate);
            }

            nextDayEvaluations.TryGetValue(employee.Id, out var nextEvaluation);
            dayPunchRows = ExcludeNextDayTemporaryPunches(
                processDate,
                evaluation,
                nextEvaluation,
                dayPunchRows);

            plans[index] = new EmployeeProcessPlan(employee, evaluation, dayPunchRows);
        }

        return plans;
    }

    private async Task<Dictionary<Guid, ShiftEvaluationDto>> GetEvaluationsByEmployeeAsync(
        Guid companyId,
        DateTime processDate,
        IReadOnlyCollection<Guid> employeeIds,
        CancellationToken cancellationToken)
    {
        var rows = await shiftClient.GetShiftEvaluationsAsync(
            companyId,
            employeeIds,
            processDate,
            cancellationToken);

        if (rows.Count == 0)
        {
            return [];
        }

        return rows
            .Select(ShiftEvaluationNormalizer.Normalize)
            .GroupBy(e => e.EmployeeId)
            .ToDictionary(g => g.Key, g => g.First());
    }

    private async Task<Dictionary<Guid, DailyAttendance>> GetCurrentAttendancesAsync(
        Guid companyId,
        DateTime processDate,
        IReadOnlyList<Guid> employeeIds,
        CancellationToken cancellationToken)
    {
        var attendances = new Dictionary<Guid, DailyAttendance>();
        foreach (var chunk in employeeIds.Chunk(SqlParameterChunkSize))
        {
            var chunkAttendances = await db.DailyAttendances
                .Where(a => a.CompanyId == companyId
                    && a.AttendanceDate == processDate
                    && chunk.Contains(a.EmployeeId))
                .ToListAsync(cancellationToken);

            foreach (var attendance in chunkAttendances)
            {
                attendances[attendance.EmployeeId] = attendance;
            }
        }

        return attendances;
    }

    private async Task<Dictionary<Guid, HashSet<Guid>>> GetClaimedPunchIdsByEmployeeAsync(
        Guid companyId,
        DateTime processDate,
        IReadOnlyList<EmployeeProcessPlan> employeePlans,
        CancellationToken cancellationToken)
    {
        var candidateIds = employeePlans
            .SelectMany(p => p.PunchRows)
            .Select(p => p.Id)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (candidateIds.Count == 0)
        {
            return [];
        }

        var claimsByEmployee = new Dictionary<Guid, HashSet<Guid>>();
        foreach (var chunk in candidateIds.Chunk(SqlParameterChunkSize))
        {
            var existingClaims = await db.DailyAttendances
                .AsNoTracking()
                .Where(a => a.CompanyId == companyId
                    && a.AttendanceDate != processDate
                    && ((a.InPunchId.HasValue && chunk.Contains(a.InPunchId.Value))
                        || (a.OutPunchId.HasValue && chunk.Contains(a.OutPunchId.Value))))
                .Select(a => new { a.EmployeeId, a.InPunchId, a.OutPunchId })
                .ToListAsync(cancellationToken);

            foreach (var claim in existingClaims)
            {
                if (!claimsByEmployee.TryGetValue(claim.EmployeeId, out var claimedPunchIds))
                {
                    claimedPunchIds = [];
                    claimsByEmployee[claim.EmployeeId] = claimedPunchIds;
                }

                if (claim.InPunchId.HasValue)
                {
                    claimedPunchIds.Add(claim.InPunchId.Value);
                }

                if (claim.OutPunchId.HasValue)
                {
                    claimedPunchIds.Add(claim.OutPunchId.Value);
                }
            }
        }

        return claimsByEmployee;
    }

    private async Task<Dictionary<Guid, List<DeviceLog>>> GetExistingDeviceLogsAsync(
        Guid companyId,
        IReadOnlyList<Guid> employeeIds,
        DateTime windowStart,
        DateTime windowEnd,
        CancellationToken cancellationToken)
    {
        var logsByEmployee = new Dictionary<Guid, List<DeviceLog>>();
        foreach (var chunk in employeeIds.Chunk(SqlParameterChunkSize))
        {
            var logs = await db.DeviceLogs
                .Where(l => l.CompanyId == companyId
                    && l.EmployeeId.HasValue
                    && chunk.Contains(l.EmployeeId.Value)
                    && l.PunchTime >= windowStart
                    && l.PunchTime <= windowEnd)
                .ToListAsync(cancellationToken);

            foreach (var log in logs)
            {
                if (!log.EmployeeId.HasValue)
                {
                    continue;
                }

                if (!logsByEmployee.TryGetValue(log.EmployeeId.Value, out var employeeLogs))
                {
                    employeeLogs = [];
                    logsByEmployee[log.EmployeeId.Value] = employeeLogs;
                }

                employeeLogs.Add(log);
            }
        }

        return logsByEmployee;
    }

    private static List<PunchRecordRow> ExcludeNextDayTemporaryPunches(
        DateTime processDate,
        ShiftEvaluationDto evaluation,
        ShiftEvaluationDto? nextEvaluation,
        List<PunchRecordRow> punches)
    {
        if (!IsGeneralDutyDayShift(evaluation)
            || evaluation.PunchWindowEnd.Date <= processDate.Date
            || string.Equals(evaluation.AssignmentSource, "Temporary", StringComparison.OrdinalIgnoreCase))
        {
            return punches;
        }

        if (nextEvaluation is null)
        {
            return punches;
        }

        nextEvaluation = ShiftEvaluationNormalizer.Normalize(nextEvaluation);
        if (!string.Equals(nextEvaluation.AssignmentSource, "Temporary", StringComparison.OrdinalIgnoreCase))
        {
            return punches;
        }

        return punches
            .Where(p => p.PunchTime < nextEvaluation.PunchWindowStart || p.PunchTime >= nextEvaluation.PunchWindowEnd)
            .ToList();
    }

    private static bool IsGeneralDutyDayShift(ShiftEvaluationDto evaluation) =>
        !evaluation.IsCrossDay
        && string.Equals(evaluation.ShiftCategory, "GeneralDuty", StringComparison.OrdinalIgnoreCase);

    private void SyncDeviceLogsInWindow(
        Guid companyId,
        EmployeeDirectoryEntry employee,
        DateTime windowStart,
        DateTime windowEnd,
        List<PunchRecordRow> dayPunchRows,
        IReadOnlyDictionary<Guid, List<DeviceLog>> existingDeviceLogs)
    {
        var logsInWindow = new List<DeviceLog>();
        if (existingDeviceLogs.TryGetValue(employee.Id, out var existing))
        {
            logsInWindow = existing
                .Where(l => l.PunchTime >= windowStart && l.PunchTime < windowEnd)
                .ToList();
        }

        if (AreDeviceLogsInSync(logsInWindow, dayPunchRows, employee))
        {
            return;
        }

        if (logsInWindow.Count > 0)
        {
            db.DeviceLogs.RemoveRange(logsInWindow);
        }

        foreach (var punch in dayPunchRows)
        {
            db.DeviceLogs.Add(new DeviceLog
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                EmployeeId = employee.Id,
                PunchNumber = employee.PunchNumber,
                EmployeeID = employee.EmployeeID,
                PunchTime = punch.PunchTime,
                DeviceSerial = punch.DeviceId,
                IsProcessed = true,
                CreatedAt = BusinessTime.Now,
            });
        }
    }

    private static bool AreDeviceLogsInSync(
        IReadOnlyList<DeviceLog> existingLogs,
        IReadOnlyList<PunchRecordRow> punchRows,
        EmployeeDirectoryEntry employee)
    {
        if (existingLogs.Count != punchRows.Count)
        {
            return false;
        }

        var expected = punchRows
            .Select(p => new DeviceLogKey(employee.PunchNumber, employee.EmployeeID, p.PunchTime, p.DeviceId ?? string.Empty))
            .OrderBy(p => p.PunchTime)
            .ThenBy(p => p.DeviceSerial, StringComparer.Ordinal)
            .ToList();

        var actual = existingLogs
            .Select(l => new DeviceLogKey(l.PunchNumber, l.EmployeeID, l.PunchTime, l.DeviceSerial ?? string.Empty))
            .OrderBy(l => l.PunchTime)
            .ThenBy(l => l.DeviceSerial, StringComparer.Ordinal)
            .ToList();

        return actual.SequenceEqual(expected);
    }

    private void MarkUnchanged(DailyAttendance attendance)
    {
        if (db is DbContext efDb)
        {
            efDb.Entry(attendance).State = EntityState.Unchanged;
        }
    }

    private sealed record EmployeeProcessPlan(
        EmployeeDirectoryEntry Employee,
        ShiftEvaluationDto Evaluation,
        List<PunchRecordRow> PunchRows);

    private sealed record DeviceLogKey(
        int PunchNumber,
        string EmployeeID,
        DateTime PunchTime,
        string DeviceSerial);

    private sealed record AttendanceSnapshot(
        int PunchNumber,
        string EmployeeID,
        Guid? ShiftId,
        string? ShiftName,
        DateTime? InTime,
        DateTime? OutTime,
        Guid? InPunchId,
        Guid? OutPunchId,
        AttendanceStatus Status,
        DayType DayType,
        int LateMinutes,
        int EarlyOutMinutes,
        int WorkingMinutes,
        int BreakMinutes,
        int OvertimeMinutes,
        string? Remarks)
    {
        public static AttendanceSnapshot Create(DailyAttendance attendance) =>
            new(
                attendance.PunchNumber,
                attendance.EmployeeID,
                attendance.ShiftId,
                attendance.ShiftName,
                attendance.InTime,
                attendance.OutTime,
                attendance.InPunchId,
                attendance.OutPunchId,
                attendance.Status,
                attendance.DayType,
                attendance.LateMinutes,
                attendance.EarlyOutMinutes,
                attendance.WorkingMinutes,
                attendance.BreakMinutes,
                attendance.OvertimeMinutes,
                attendance.Remarks);

        public bool HasChanged(DailyAttendance attendance) =>
            PunchNumber != attendance.PunchNumber
            || !string.Equals(EmployeeID, attendance.EmployeeID, StringComparison.Ordinal)
            || ShiftId != attendance.ShiftId
            || !string.Equals(ShiftName, attendance.ShiftName, StringComparison.Ordinal)
            || InTime != attendance.InTime
            || OutTime != attendance.OutTime
            || InPunchId != attendance.InPunchId
            || OutPunchId != attendance.OutPunchId
            || Status != attendance.Status
            || DayType != attendance.DayType
            || LateMinutes != attendance.LateMinutes
            || EarlyOutMinutes != attendance.EarlyOutMinutes
            || WorkingMinutes != attendance.WorkingMinutes
            || BreakMinutes != attendance.BreakMinutes
            || OvertimeMinutes != attendance.OvertimeMinutes
            || !string.Equals(Remarks, attendance.Remarks, StringComparison.Ordinal);
    }
}
