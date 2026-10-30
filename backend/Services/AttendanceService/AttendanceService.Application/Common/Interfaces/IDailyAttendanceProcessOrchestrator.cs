using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Common.Interfaces;

public interface IDailyAttendanceProcessOrchestrator
{
    Task<ProcessDailyAttendanceResult> ProcessDayAsync(
        Guid companyId,
        DateTime date,
        IReadOnlyList<string>? employeeIDs = null,
        CancellationToken cancellationToken = default);
}
