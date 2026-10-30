using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Common.Interfaces;

public interface IShiftServiceClient
{
    Task<ShiftEvaluationDto?> GetShiftEvaluationAsync(Guid companyId, Guid employeeId, DateTime date, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ShiftEvaluationDto>> GetShiftEvaluationsAsync(
        Guid companyId,
        IReadOnlyCollection<Guid> employeeIds,
        DateTime date,
        CancellationToken cancellationToken = default);
}
