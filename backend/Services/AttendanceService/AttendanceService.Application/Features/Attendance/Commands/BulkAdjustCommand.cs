using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Entities;
using Erp.BuildingBlocks.SharedKernel;

namespace AttendanceService.Application.Features.Attendance.Commands;

public record BulkAdjustAttendanceCommand(
    Guid CompanyId,
    Guid AdminId,
    IReadOnlyList<BulkAdjustEntryDto> Entries) : IRequest<BulkAdjustResult>;

public record DeleteDailyAttendanceCommand(Guid Id, Guid CompanyId) : IRequest<bool>;

public sealed class BulkAdjustAttendanceHandler(
    IAttendanceDbContext db,
    IMediator mediator,
    IEmployeeDirectory employeeDirectory) :
    IRequestHandler<BulkAdjustAttendanceCommand, BulkAdjustResult>,
    IRequestHandler<DeleteDailyAttendanceCommand, bool>
{
    public async Task<BulkAdjustResult> Handle(BulkAdjustAttendanceCommand request, CancellationToken cancellationToken)
    {
        var success = 0;
        var errors = new List<string>();

        foreach (var entry in request.Entries)
        {
            try
            {
                DailyAttendance? attendance = null;
                if (entry.DailyAttendanceId.HasValue && entry.DailyAttendanceId != Guid.Empty)
                {
                    attendance = await db.DailyAttendances
                        .FirstOrDefaultAsync(
                            a => a.Id == entry.DailyAttendanceId && a.CompanyId == request.CompanyId,
                            cancellationToken);
                }
                else if (!string.IsNullOrWhiteSpace(entry.EmployeeID) && entry.Date.HasValue)
                {
                    var employeeId = await employeeDirectory.ResolveEmployeeIdByEmployeeIDAsync(
                        request.CompanyId,
                        entry.EmployeeID.Trim(),
                        cancellationToken);
                    if (employeeId is null)
                    {
                        errors.Add($"Employee not found: {entry.EmployeeID}");
                        continue;
                    }

                    var date = AttendanceDateRange.ToCalendarDate(entry.Date.Value);
                    attendance = await db.DailyAttendances.FirstOrDefaultAsync(
                        a => a.CompanyId == request.CompanyId && a.EmployeeId == employeeId && a.AttendanceDate == date,
                        cancellationToken);

                    if (attendance is null)
                    {
                        var employees = await employeeDirectory.GetEmployeesByIdAsync(request.CompanyId, cancellationToken);
                        if (!employees.TryGetValue(employeeId.Value, out var emp))
                        {
                            errors.Add($"Employee directory entry missing for {entry.EmployeeID}");
                            continue;
                        }

                        attendance = new DailyAttendance
                        {
                            Id = Guid.NewGuid(),
                            CompanyId = request.CompanyId,
                            EmployeeId = employeeId.Value,
                            PunchNumber = emp.PunchNumber,
                            EmployeeID = emp.EmployeeID,
                            AttendanceDate = date,
                            CreatedAt = BusinessTime.NowOffset
                        };
                        db.DailyAttendances.Add(attendance);
                    }
                }

                if (attendance is null)
                {
                    errors.Add("Entry requires dailyAttendanceId or employeeID+date");
                    continue;
                }

                var ok = await mediator.Send(
                    new ManualAdjustmentCommand(
                        attendance.Id,
                        entry.InTime,
                        entry.OutTime,
                        entry.Remarks,
                        request.AdminId),
                    cancellationToken);

                if (ok)
                {
                    success++;
                }
                else
                {
                    errors.Add($"Adjust failed for attendance {attendance.Id}");
                }
            }
            catch (Exception ex)
            {
                errors.Add(ex.Message);
            }
        }

        return new BulkAdjustResult(success, request.Entries.Count - success, errors);
    }

    public async Task<bool> Handle(DeleteDailyAttendanceCommand request, CancellationToken cancellationToken)
    {
        var attendance = await db.DailyAttendances
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.CompanyId == request.CompanyId, cancellationToken);
        if (attendance is null)
        {
            return false;
        }

        db.DailyAttendances.Remove(attendance);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
