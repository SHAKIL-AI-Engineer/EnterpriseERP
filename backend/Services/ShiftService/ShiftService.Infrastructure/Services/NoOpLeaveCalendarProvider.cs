using ShiftService.Application.Common.Interfaces;

namespace ShiftService.Infrastructure.Services;

/// <summary>Used when ShiftService runs standalone without Leave DB.</summary>
public sealed class NoOpLeaveCalendarProvider : ILeaveCalendarProvider
{
    public Task<bool> IsWeeklyOffAsync(Guid companyId, DateTime date, CancellationToken cancellationToken = default) =>
        Task.FromResult(false);

    public Task<bool> IsHolidayAsync(Guid companyId, DateTime date, CancellationToken cancellationToken = default) =>
        Task.FromResult(false);
}
