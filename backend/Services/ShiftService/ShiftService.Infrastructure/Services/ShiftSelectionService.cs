using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Domain.Entities;
using ShiftService.Infrastructure.Persistence;

namespace ShiftService.Infrastructure.Services;

public class ShiftSelectionService(ShiftDbContext db) : IShiftSelectionService
{
    public async Task<Shift?> GetApplicableShiftAsync(Guid companyId, Guid employeeId, DateTime attendanceDate)
    {
        return (await GetApplicableShiftWithSourceAsync(companyId, employeeId, attendanceDate))?.Shift;
    }

    public async Task<ShiftSelectionResult?> GetApplicableShiftWithSourceAsync(
        Guid companyId,
        Guid employeeId,
        DateTime attendanceDate)
    {
        var date = attendanceDate.Date;

        var temp = await db.TemporaryShiftAssignments
            .AsNoTracking()
            .Include(t => t.Shift)
            .ThenInclude(s => s!.Rule)
            .FirstOrDefaultAsync(t => t.CompanyId == companyId
                && t.EmployeeId == employeeId
                && t.ShiftDate.Date == date);

        if (temp?.Shift != null)
        {
            return new ShiftSelectionResult(temp.Shift, "Temporary");
        }

        var regular = await db.EmployeeShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .ThenInclude(s => s!.Rule)
            .FirstOrDefaultAsync(a => a.CompanyId == companyId
                && a.EmployeeId == employeeId
                && a.IsCurrent
                && a.EffectiveFrom <= date
                && (a.EffectiveTo == null || a.EffectiveTo >= date));

        if (regular?.Shift != null)
        {
            return new ShiftSelectionResult(regular.Shift, "Roster");
        }

        var def = await db.Shifts
            .AsNoTracking()
            .Include(s => s.Rule)
            .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.IsDefault && s.IsActive);

        return def is null ? null : new ShiftSelectionResult(def, "General");
    }

    public (DateTime Start, DateTime End) CalculateShiftDateTime(Shift shift, DateTime attendanceDate)
    {
        var start = attendanceDate.Date.Add(shift.StartTime);
        var end = shift.IsCrossDay
            ? attendanceDate.Date.AddDays(1).Add(shift.EndTime)
            : attendanceDate.Date.Add(shift.EndTime);

        return (start, end);
    }
}
