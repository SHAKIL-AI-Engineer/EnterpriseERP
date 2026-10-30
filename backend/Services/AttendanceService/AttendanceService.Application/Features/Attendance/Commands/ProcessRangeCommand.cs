using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using Erp.BuildingBlocks.SharedKernel;

namespace AttendanceService.Application.Features.Attendance.Commands;

public record ProcessDailyAttendanceRangeCommand(
    Guid CompanyId,
    DateTime StartDate,
    DateTime EndDate,
    IReadOnlyList<string>? EmployeeIDs = null,
    Guid? ProcessedBy = null) : IRequest<ProcessRangeResult>;

public sealed class ProcessDailyAttendanceRangeHandler(
    IDailyAttendanceProcessOrchestrator orchestrator,
    IAttendanceDbContext db)
    : IRequestHandler<ProcessDailyAttendanceRangeCommand, ProcessRangeResult>
{
    public async Task<ProcessRangeResult> Handle(
        ProcessDailyAttendanceRangeCommand request,
        CancellationToken cancellationToken)
    {
        var start = AttendanceDateRange.ToCalendarDate(request.StartDate);
        var end = AttendanceDateRange.ToCalendarDate(request.EndDate);
        if (end < start)
        {
            (start, end) = (end, start);
        }

        var batch = new AttendanceProcessBatch
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            ProcessFromDate = start,
            ProcessToDate = end,
            ProcessStatus = ProcessStatus.Processing,
            ProcessedBy = request.ProcessedBy,
            StartedAt = BusinessTime.Now,
        };
        db.AttendanceProcessBatches.Add(batch);

        var errors = new List<ProcessRangeDayError>();
        var daysProcessed = 0;
        var recordsProcessed = 0;
        var presentCount = 0;
        var absentCount = 0;
        var lateCount = 0;
        var createdCount = 0;
        var updatedCount = 0;
        var skippedLockedCount = 0;
        var failedDays = 0;

        for (var day = start; day <= end; day = day.AddDays(1))
        {
            try
            {
                var result = await orchestrator.ProcessDayAsync(
                    request.CompanyId,
                    day,
                    request.EmployeeIDs,
                    cancellationToken);
                daysProcessed++;
                recordsProcessed += result.RecordsProcessed;
                presentCount += result.PresentCount;
                absentCount += result.AbsentCount;
                lateCount += result.LateCount;
                createdCount += result.CreatedCount;
                updatedCount += result.UpdatedCount;
                skippedLockedCount += result.SkippedLockedCount;
                batch.ProcessedEmployees += result.RecordsProcessed;
            }
            catch (Exception ex)
            {
                failedDays++;
                errors.Add(new ProcessRangeDayError(day.ToString("yyyy-MM-dd"), ex.Message));
                db.AttendanceProcessErrors.Add(new AttendanceProcessError
                {
                    Id = Guid.NewGuid(),
                    BatchId = batch.Id,
                    CompanyId = request.CompanyId,
                    AttendanceDate = day,
                    ErrorMessage = ex.Message,
                    CreatedAt = BusinessTime.Now,
                });
            }
        }

        batch.TotalEmployees = recordsProcessed;
        batch.FailedEmployees = failedDays;
        batch.FinishedAt = BusinessTime.Now;
        batch.ProcessStatus = failedDays == 0
            ? ProcessStatus.Success
            : daysProcessed > 0
                ? ProcessStatus.Partial
                : ProcessStatus.Failed;
        if (failedDays > 0 && daysProcessed == 0)
        {
            batch.ErrorMessage = errors.FirstOrDefault()?.Message;
        }

        await db.SaveChangesAsync(cancellationToken);

        return new ProcessRangeResult(
            daysProcessed,
            recordsProcessed,
            presentCount,
            absentCount,
            lateCount,
            createdCount,
            updatedCount,
            skippedLockedCount,
            batch.Id,
            errors);
    }
}
