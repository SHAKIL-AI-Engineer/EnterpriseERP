using LeaveService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common.Interfaces;

namespace EnterpriseERP.Platform.Host.Integration;

public sealed class LeaveCalendarProvider(LeaveDbContext leaveDb) : ILeaveCalendarProvider
{
    public async Task<bool> IsWeeklyOffAsync(Guid companyId, DateTime date, CancellationToken cancellationToken = default)
    {
        var dayName = date.DayOfWeek.ToString();
        return await leaveDb.WeeklyOffRules.AsNoTracking()
            .AnyAsync(r => r.CompanyId == companyId && r.IsActive
                && r.DayOfWeekName == dayName, cancellationToken);
    }

    public async Task<bool> IsHolidayAsync(Guid companyId, DateTime date, CancellationToken cancellationToken = default)
    {
        var d = DateOnly.FromDateTime(date.Date);
        return await leaveDb.Holidays.AsNoTracking()
            .AnyAsync(h => h.CompanyId == companyId && h.IsActive && h.HolidayDate == d, cancellationToken);
    }
}
