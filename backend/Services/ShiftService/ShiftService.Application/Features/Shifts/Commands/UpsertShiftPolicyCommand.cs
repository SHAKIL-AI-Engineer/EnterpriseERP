using MediatR;
using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Application.DTOs;
using ShiftService.Domain.Entities;

using Erp.BuildingBlocks.SharedKernel;

namespace ShiftService.Application.Features.Shifts.Commands;

public record UpsertShiftPolicyCommand(
    Guid ShiftId, // route body must match shift id
    int InGraceMinutes,
    int OutGraceMinutes,
    int LateAfterMinutes,
    int EarlyOutBeforeMinutes,
    int MinimumWorkingMinutes,
    int HalfDayWorkingMinutes,
    bool AllowOvertime,
    int OvertimeStartAfterMinutes,
    int MinimumOvertimeMinutes,
    int MaximumOvertimeMinutes,
    int LunchBreakMinutes,
    bool DeductLunchFromWorking,
    bool HolidayWorkAllAsOvertime,
    bool WeeklyOffWorkAllAsOvertime) : IRequest<ShiftPolicyDto>;

public class UpsertShiftPolicyHandler(IShiftDbContext db) : IRequestHandler<UpsertShiftPolicyCommand, ShiftPolicyDto>
{
    public async Task<ShiftPolicyDto> Handle(UpsertShiftPolicyCommand request, CancellationToken cancellationToken)
    {
        var shift = await db.Shifts.FirstOrDefaultAsync(s => s.Id == request.ShiftId, cancellationToken)
            ?? throw new InvalidOperationException("Shift not found");

        var rule = await db.ShiftRules.FirstOrDefaultAsync(r => r.ShiftId == request.ShiftId, cancellationToken);
        if (rule is null)
        {
            rule = new ShiftRule
            {
                Id = Guid.NewGuid(),
                CompanyId = shift.CompanyId,
                ShiftId = shift.Id,
                CreatedAt = BusinessTime.Now
            };
            db.ShiftRules.Add(rule);
        }

        rule.InGraceMinutes = request.InGraceMinutes;
        rule.OutGraceMinutes = request.OutGraceMinutes;
        rule.LateAfterMinutes = request.LateAfterMinutes;
        rule.EarlyOutBeforeMinutes = request.EarlyOutBeforeMinutes;
        rule.MinimumWorkingMinutes = request.MinimumWorkingMinutes;
        rule.HalfDayWorkingMinutes = request.HalfDayWorkingMinutes;
        rule.AllowOvertime = request.AllowOvertime;
        rule.OvertimeStartAfterMinutes = request.OvertimeStartAfterMinutes;
        rule.MinimumOvertimeMinutes = request.MinimumOvertimeMinutes;
        rule.MaximumOvertimeMinutes = request.MaximumOvertimeMinutes;
        rule.LunchBreakMinutes = request.LunchBreakMinutes;
        rule.DeductLunchFromWorking = request.DeductLunchFromWorking;
        rule.HolidayWorkAllAsOvertime = request.HolidayWorkAllAsOvertime;
        rule.WeeklyOffWorkAllAsOvertime = request.WeeklyOffWorkAllAsOvertime;
        rule.UpdatedAt = BusinessTime.Now;

        await db.SaveChangesAsync(cancellationToken);
        return ShiftDtoMapping.ToPolicyDto(rule);
    }
}
