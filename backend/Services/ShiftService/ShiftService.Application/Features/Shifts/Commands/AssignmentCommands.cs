using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Domain.Entities;

namespace ShiftService.Application.Features.Shifts.Commands;

public record AssignEmployeeShiftCommand(
    Guid CompanyId, Guid EmployeeId, Guid ShiftId, DateTime EffectiveFrom,
    DateTime? EffectiveTo, Guid? AssignedBy) : IRequest<Guid>;

public record AssignTemporaryShiftCommand(
    Guid CompanyId, Guid EmployeeId, Guid ShiftId, DateTime ShiftDate,
    string? Reason, Guid? CreatedBy) : IRequest<Guid>;

public record UpdateTemporaryShiftCommand(
    Guid Id, Guid CompanyId, Guid EmployeeId, Guid ShiftId, DateTime ShiftDate,
    string? Reason, Guid? UpdatedBy) : IRequest<bool>;

public record DeleteTemporaryShiftCommand(Guid Id) : IRequest<bool>;

public class AssignmentHandlers(IShiftDbContext db) :
    IRequestHandler<AssignEmployeeShiftCommand, Guid>,
    IRequestHandler<AssignTemporaryShiftCommand, Guid>,
    IRequestHandler<UpdateTemporaryShiftCommand, bool>,
    IRequestHandler<DeleteTemporaryShiftCommand, bool>
{
    public async Task<Guid> Handle(AssignEmployeeShiftCommand request, CancellationToken cancellationToken)
    {
        var current = await db.EmployeeShiftAssignments
            .FirstOrDefaultAsync(a => a.CompanyId == request.CompanyId
                && a.EmployeeId == request.EmployeeId
                && a.IsCurrent, cancellationToken);

        if (current != null)
        {
            current.IsCurrent = false;
            var closeDate = request.EffectiveFrom.Date.AddDays(-1);
            if (closeDate >= current.EffectiveFrom.Date)
            {
                current.EffectiveTo ??= closeDate;
            }
            else
            {
                current.EffectiveTo ??= request.EffectiveFrom.Date;
            }
        }

        var assignment = new EmployeeShiftAssignment
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            EmployeeId = request.EmployeeId,
            ShiftId = request.ShiftId,
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            IsCurrent = true,
            AssignedBy = request.AssignedBy,
            AssignedAt = BusinessTime.Now
        };

        db.EmployeeShiftAssignments.Add(assignment);
        await db.SaveChangesAsync(cancellationToken);
        return assignment.Id;
    }

    public async Task<Guid> Handle(AssignTemporaryShiftCommand request, CancellationToken cancellationToken)
    {
        var assignment = await db.TemporaryShiftAssignments
            .FirstOrDefaultAsync(a => a.CompanyId == request.CompanyId
                && a.EmployeeId == request.EmployeeId
                && a.ShiftDate.Date == request.ShiftDate.Date, cancellationToken);

        if (assignment is null)
        {
            assignment = new TemporaryShiftAssignment
            {
                Id = Guid.NewGuid(),
                CompanyId = request.CompanyId,
                EmployeeId = request.EmployeeId,
                ShiftDate = request.ShiftDate.Date,
                CreatedAt = BusinessTime.Now
            };
            db.TemporaryShiftAssignments.Add(assignment);
        }

        assignment.ShiftId = request.ShiftId;
        assignment.Reason = request.Reason;
        assignment.CreatedBy = request.CreatedBy;

        await db.SaveChangesAsync(cancellationToken);
        return assignment.Id;
    }

    public async Task<bool> Handle(UpdateTemporaryShiftCommand request, CancellationToken cancellationToken)
    {
        var assignment = await db.TemporaryShiftAssignments.FindAsync([request.Id], cancellationToken);
        if (assignment is null)
        {
            return false;
        }

        assignment.CompanyId = request.CompanyId;
        assignment.EmployeeId = request.EmployeeId;
        assignment.ShiftId = request.ShiftId;
        assignment.ShiftDate = request.ShiftDate.Date;
        assignment.Reason = request.Reason;
        assignment.CreatedBy = request.UpdatedBy ?? assignment.CreatedBy;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(DeleteTemporaryShiftCommand request, CancellationToken cancellationToken)
    {
        var temp = await db.TemporaryShiftAssignments.FindAsync([request.Id], cancellationToken);
        if (temp == null) return false;

        db.TemporaryShiftAssignments.Remove(temp);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
