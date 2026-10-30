namespace ShiftService.Application.Common.Interfaces;

public interface ILeaveCalendarProvider
{
    Task<bool> IsWeeklyOffAsync(Guid companyId, DateTime date, CancellationToken cancellationToken = default);
    Task<bool> IsHolidayAsync(Guid companyId, DateTime date, CancellationToken cancellationToken = default);
}
