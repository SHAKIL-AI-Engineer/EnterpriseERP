using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Application.DTOs;
using ShiftService.Domain.Entities;

namespace ShiftService.Application.Common;

public static class ShiftPolicyProvisioning
{
    public static async Task<ShiftPolicyDto> EnsurePolicyAsync(
        IShiftDbContext db,
        Guid shiftId,
        CancellationToken cancellationToken = default)
    {
        var shift = await db.Shifts.FirstOrDefaultAsync(s => s.Id == shiftId, cancellationToken)
            ?? throw new InvalidOperationException("Shift not found");

        var rule = await db.ShiftRules.FirstOrDefaultAsync(r => r.ShiftId == shiftId, cancellationToken);
        if (rule is null)
        {
            rule = ShiftPolicyTemplates.CreateDefaultRule(shift.CompanyId, shift.Id, shift.ShiftCategory);
            db.ShiftRules.Add(rule);
            await db.SaveChangesAsync(cancellationToken);
        }

        return ShiftDtoMapping.ToPolicyDto(rule);
    }

    public static async Task<IReadOnlyList<ShiftBreakDto>> EnsureBreaksAsync(
        IShiftDbContext db,
        Guid shiftId,
        CancellationToken cancellationToken = default)
    {
        var shift = await db.Shifts.FirstOrDefaultAsync(s => s.Id == shiftId, cancellationToken)
            ?? throw new InvalidOperationException("Shift not found");

        var breaks = await db.ShiftBreaks.Where(b => b.ShiftId == shiftId).ToListAsync(cancellationToken);
        if (breaks.Count == 0)
        {
            db.ShiftBreaks.Add(ShiftPolicyTemplates.CreateDefaultLunchBreak(shift.CompanyId, shift.Id, shift.StartTime));
            await db.SaveChangesAsync(cancellationToken);
            breaks = await db.ShiftBreaks.Where(b => b.ShiftId == shiftId).ToListAsync(cancellationToken);
        }

        return breaks.Select(ShiftDtoMapping.ToBreakDto).ToList();
    }

    public static async Task BackfillAllShiftsAsync(IShiftDbContext db, CancellationToken cancellationToken = default)
    {
        var shiftIds = await db.Shifts.Select(s => s.Id).ToListAsync(cancellationToken);
        foreach (var shiftId in shiftIds)
        {
            await EnsurePolicyAsync(db, shiftId, cancellationToken);
            await EnsureBreaksAsync(db, shiftId, cancellationToken);
        }
    }
}
