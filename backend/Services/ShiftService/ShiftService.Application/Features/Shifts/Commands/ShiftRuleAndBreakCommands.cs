using MediatR;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace ShiftService.Application.Features.Shifts.Commands;

public record CreateShiftRuleCommand(
    Guid CompanyId, Guid ShiftId, int InGraceMinutes, int OutGraceMinutes,
    int LateAfterMinutes, int EarlyOutBeforeMinutes, int MinimumWorkingMinutes,
    int HalfDayWorkingMinutes, bool AllowOvertime, int OvertimeStartAfterMinutes,
    int MinimumOvertimeMinutes, int MaximumOvertimeMinutes) : IRequest<Guid>;

public record CreateShiftBreakCommand(
    Guid CompanyId, Guid ShiftId, ShiftService.Domain.Enums.BreakType BreakType, string BreakName,
    TimeSpan BreakStartTime, TimeSpan BreakEndTime, int BreakMinutes, bool IsPaidBreak) : IRequest<Guid>;

public record UpdateShiftRuleCommand(
    Guid Id, int InGraceMinutes, int OutGraceMinutes,
    int LateAfterMinutes, int EarlyOutBeforeMinutes, int MinimumWorkingMinutes,
    int HalfDayWorkingMinutes, bool AllowOvertime, int OvertimeStartAfterMinutes,
    int MinimumOvertimeMinutes, int MaximumOvertimeMinutes) : IRequest<bool>;

public class ShiftRuleAndBreakHandlers(IShiftDbContext db) :
    IRequestHandler<CreateShiftRuleCommand, Guid>,
    IRequestHandler<CreateShiftBreakCommand, Guid>,
    IRequestHandler<UpdateShiftRuleCommand, bool>,
    IRequestHandler<UpdateShiftBreakCommand, bool>,
    IRequestHandler<DeleteShiftBreakCommand, bool>
{
    public async Task<Guid> Handle(CreateShiftRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = new ShiftRule
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            ShiftId = request.ShiftId,
            InGraceMinutes = request.InGraceMinutes,
            OutGraceMinutes = request.OutGraceMinutes,
            LateAfterMinutes = request.LateAfterMinutes,
            EarlyOutBeforeMinutes = request.EarlyOutBeforeMinutes,
            MinimumWorkingMinutes = request.MinimumWorkingMinutes,
            HalfDayWorkingMinutes = request.HalfDayWorkingMinutes,
            AllowOvertime = request.AllowOvertime,
            OvertimeStartAfterMinutes = request.OvertimeStartAfterMinutes,
            MinimumOvertimeMinutes = request.MinimumOvertimeMinutes,
            MaximumOvertimeMinutes = request.MaximumOvertimeMinutes,
            CreatedAt = BusinessTime.Now
        };

        db.ShiftRules.Add(rule);
        await db.SaveChangesAsync(cancellationToken);
        return rule.Id;
    }

    public async Task<Guid> Handle(CreateShiftBreakCommand request, CancellationToken cancellationToken)
    {
        var @break = new ShiftBreak
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            ShiftId = request.ShiftId,
            BreakType = request.BreakType,
            BreakName = request.BreakName,
            BreakStartTime = request.BreakStartTime,
            BreakEndTime = request.BreakEndTime,
            BreakMinutes = request.BreakMinutes,
            IsPaidBreak = request.IsPaidBreak,
            IsActive = true
        };

        db.ShiftBreaks.Add(@break);
        await db.SaveChangesAsync(cancellationToken);
        return @break.Id;
    }

    public async Task<bool> Handle(UpdateShiftRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await db.ShiftRules.FindAsync([request.Id], cancellationToken);
        if (rule == null) return false;

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
        rule.UpdatedAt = BusinessTime.Now;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(UpdateShiftBreakCommand request, CancellationToken cancellationToken)
    {
        var @break = await db.ShiftBreaks.FindAsync([request.Id], cancellationToken);
        if (@break == null) return false;

        @break.BreakName = request.BreakName;
        @break.BreakStartTime = request.BreakStartTime;
        @break.BreakEndTime = request.BreakEndTime;
        @break.BreakMinutes = request.BreakMinutes;
        @break.IsPaidBreak = request.IsPaidBreak;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(DeleteShiftBreakCommand request, CancellationToken cancellationToken)
    {
        var @break = await db.ShiftBreaks.FindAsync([request.Id], cancellationToken);
        if (@break == null) return false;

        db.ShiftBreaks.Remove(@break);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record UpdateShiftBreakCommand(
    Guid Id, string BreakName, TimeSpan BreakStartTime,
    TimeSpan BreakEndTime, int BreakMinutes, bool IsPaidBreak) : IRequest<bool>;

public record DeleteShiftBreakCommand(Guid Id) : IRequest<bool>;
