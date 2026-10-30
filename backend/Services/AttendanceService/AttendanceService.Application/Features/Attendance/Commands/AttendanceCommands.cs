using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;

using AttendanceService.Domain.Entities;

using AttendanceService.Application.DTOs;

using Erp.BuildingBlocks.SharedKernel;



namespace AttendanceService.Application.Features.Attendance.Commands;



public record ProcessDailyAttendanceCommand(
    Guid CompanyId,
    DateTime Date,
    IReadOnlyList<string>? EmployeeIDs = null) : IRequest<ProcessDailyAttendanceResult>;

public record UploadPunchLogsCommand(Guid CompanyId, List<PunchLogDto> Logs) : IRequest<int>;

public record ManualAdjustmentCommand(Guid Id, DateTime? InTime, DateTime? OutTime, string? Remarks, Guid AdminId) : IRequest<bool>;

public record ApproveAttendanceCommand(Guid Id, Guid AdminId) : IRequest<bool>;



public class AttendanceCommandHandlers(

    IAttendanceDbContext db,

    IShiftServiceClient shiftClient,

    IAttendanceProcessingService processingService,

    IEmployeeDirectory employeeDirectory,

    IDailyAttendanceProcessOrchestrator processOrchestrator) :

    IRequestHandler<ProcessDailyAttendanceCommand, ProcessDailyAttendanceResult>,

    IRequestHandler<UploadPunchLogsCommand, int>,

    IRequestHandler<ManualAdjustmentCommand, bool>,

    IRequestHandler<ApproveAttendanceCommand, bool>

{

    public Task<ProcessDailyAttendanceResult> Handle(

        ProcessDailyAttendanceCommand request,

        CancellationToken cancellationToken) =>

        processOrchestrator.ProcessDayAsync(

            request.CompanyId,

            request.Date,

            request.EmployeeIDs,

            cancellationToken);



    public async Task<bool> Handle(ManualAdjustmentCommand request, CancellationToken cancellationToken)

    {

        var attendance = await db.DailyAttendances.FindAsync([request.Id], cancellationToken);

        if (attendance == null) return false;



        if (request.InTime.HasValue)

        {

            attendance.InTime = request.InTime;

            attendance.IsManualIn = true;

        }

        if (request.OutTime.HasValue)

        {

            attendance.OutTime = request.OutTime;

            attendance.IsManualOut = true;

        }

        attendance.Remarks = request.Remarks;

        attendance.IsManualAdjusted = true;

        attendance.UpdatedAt = BusinessTime.NowOffset;

        attendance.UpdatedBy = request.AdminId;



        var evaluation = await shiftClient.GetShiftEvaluationAsync(

            attendance.CompanyId, attendance.EmployeeId, attendance.AttendanceDate, cancellationToken)

            ?? ShiftEvaluationFallback.Create(

                attendance.CompanyId, attendance.EmployeeId, attendance.AttendanceDate);

        evaluation = ShiftEvaluationNormalizer.Normalize(evaluation);

        var employeesById = await employeeDirectory.GetEmployeesByIdAsync(attendance.CompanyId, cancellationToken);
        var isOtEnabled = employeesById.TryGetValue(attendance.EmployeeId, out var employeeEntry)
            && employeeEntry.IsOtEnabled;

        processingService.Process(attendance, Array.Empty<AttendancePunchInput>(), evaluation, isOtEnabled);



        await db.SaveChangesAsync(cancellationToken);

        return true;

    }



    public async Task<bool> Handle(ApproveAttendanceCommand request, CancellationToken cancellationToken)

    {

        var attendance = await db.DailyAttendances.FindAsync([request.Id], cancellationToken);

        if (attendance == null) return false;



        attendance.IsApproved = true;

        attendance.ApprovedBy = request.AdminId;

        attendance.ApprovedAt = BusinessTime.Now;



        await db.SaveChangesAsync(cancellationToken);

        return true;

    }



    public async Task<int> Handle(UploadPunchLogsCommand request, CancellationToken cancellationToken)

    {

        var logs = request.Logs.Select(l => new DeviceLog

        {

            Id = Guid.NewGuid(),

            CompanyId = request.CompanyId,

            PunchNumber = l.PunchNumber,

            EmployeeID = l.EmployeeID ?? string.Empty,

            PunchTime = l.PunchTime,

            DeviceSerial = l.DeviceSerial,

            IsProcessed = false,

            CreatedAt = BusinessTime.Now

        }).ToList();



        db.DeviceLogs.AddRange(logs);

        return await db.SaveChangesAsync(cancellationToken);

    }

}


