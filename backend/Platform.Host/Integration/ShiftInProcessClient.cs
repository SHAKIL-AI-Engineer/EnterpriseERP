using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using ShiftService.Application.Common.Interfaces;
using ShiftServiceDto = ShiftService.Application.DTOs.ShiftEvaluationDto;
using ShiftServicePolicyDto = ShiftService.Application.DTOs.ShiftPolicyDto;

namespace EnterpriseERP.Platform.Host.Integration;

/// <summary>
/// Resolves shift evaluations in-process (no HTTP) so the attendance engine does not depend on
/// authenticated self-calls to /api/v1/shifts/evaluation/bulk, which return 401 and silently
/// fall back to the 09:00-18:00 default shift.
/// </summary>
public sealed class ShiftInProcessClient(IShiftEvaluationService shiftEvaluation) : IShiftServiceClient
{
    public async Task<ShiftEvaluationDto?> GetShiftEvaluationAsync(
        Guid companyId,
        Guid employeeId,
        DateTime date,
        CancellationToken cancellationToken = default)
    {
        var result = await shiftEvaluation.EvaluateAsync(companyId, employeeId, date, cancellationToken);
        return result is null ? null : Map(result);
    }

    public Task<IReadOnlyList<ShiftEvaluationDto>> GetShiftEvaluationsAsync(
        Guid companyId,
        IReadOnlyCollection<Guid> employeeIds,
        DateTime date,
        CancellationToken cancellationToken = default) =>
        ShiftEvaluationManyAsync(companyId, employeeIds, date, cancellationToken);

    private async Task<IReadOnlyList<ShiftEvaluationDto>> ShiftEvaluationManyAsync(
        Guid companyId,
        IReadOnlyCollection<Guid> employeeIds,
        DateTime date,
        CancellationToken cancellationToken)
    {
        var results = await shiftEvaluation.EvaluateManyAsync(companyId, employeeIds, date, cancellationToken);
        return results.Select(Map).ToList();
    }

    private static ShiftEvaluationDto Map(ShiftServiceDto value) =>
        new(
            value.CompanyId,
            value.EmployeeId,
            value.AttendanceDate,
            value.ShiftId,
            value.ShiftName,
            value.ShiftCategory,
            value.ShiftStart,
            value.ShiftEnd,
            value.IsCrossDay,
            value.PunchWindowStart,
            value.PunchWindowEnd,
            value.CalendarDayType,
            value.IsWeeklyOff,
            value.IsHoliday,
            value.IsOffDayWorkEligibleForFullOt,
            Map(value.Policy),
            value.AssignmentSource);

    private static ShiftPolicyDto Map(ShiftServicePolicyDto value) =>
        new(
            value.Id,
            value.ShiftId,
            value.InGraceMinutes,
            value.OutGraceMinutes,
            value.LateAfterMinutes,
            value.EarlyOutBeforeMinutes,
            value.MinimumWorkingMinutes,
            value.HalfDayWorkingMinutes,
            value.AllowOvertime,
            value.OvertimeStartAfterMinutes,
            value.MinimumOvertimeMinutes,
            value.MaximumOvertimeMinutes,
            value.LunchBreakMinutes,
            value.DeductLunchFromWorking,
            value.HolidayWorkAllAsOvertime,
            value.WeeklyOffWorkAllAsOvertime);
}
