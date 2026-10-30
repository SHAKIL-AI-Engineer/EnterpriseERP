using AttendanceService.Domain.Entities;
using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Common.Interfaces;

public interface IAttendanceProcessingService
{
    DailyAttendance Process(
        DailyAttendance record,
        IReadOnlyList<AttendancePunchInput> punches,
        ShiftEvaluationDto evaluation,
        bool isOtEnabled = true);
}
