using MediatR;
using ShiftService.Application.Common;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Domain.Entities;
using ShiftService.Domain.Enums;

using Erp.BuildingBlocks.SharedKernel;

namespace ShiftService.Application.Features.Shifts.Commands;

public record CreateShiftCommand(
    Guid CompanyId, string ShiftName, string ShiftType,
    ShiftCategory ShiftCategory,
    TimeSpan StartTime, TimeSpan EndTime, bool IsCrossDay, bool IsGeneralDuty,
    bool IsDefault, int PunchWindowBeforeMinutes = 60, int? WeeklyOffDayOfWeek = null) : IRequest<Guid>;

public class CreateShiftCommandHandler(IShiftDbContext db) : IRequestHandler<CreateShiftCommand, Guid>
{
    public async Task<Guid> Handle(CreateShiftCommand request, CancellationToken cancellationToken)
    {
        var shift = new Shift
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            ShiftName = request.ShiftName,
            ShiftType = request.ShiftType,
            ShiftCategory = request.ShiftCategory,
            PunchWindowBeforeMinutes = request.PunchWindowBeforeMinutes > 0 ? request.PunchWindowBeforeMinutes : 60,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            IsCrossDay = request.IsCrossDay,
            IsGeneralDuty = request.IsGeneralDuty,
            IsDefault = request.IsDefault,
            WeeklyOffDayOfWeek = request.WeeklyOffDayOfWeek,
            CreatedAt = BusinessTime.NowOffset
        };

        ShiftPolicyTemplates.ApplyCategoryDefaults(shift);

        var rule = ShiftPolicyTemplates.CreateDefaultRule(shift.CompanyId, shift.Id, shift.ShiftCategory);
        var lunch = ShiftPolicyTemplates.CreateDefaultLunchBreak(shift.CompanyId, shift.Id, shift.StartTime);

        db.Shifts.Add(shift);
        db.ShiftRules.Add(rule);
        db.ShiftBreaks.Add(lunch);
        await db.SaveChangesAsync(cancellationToken);
        return shift.Id;
    }
}
