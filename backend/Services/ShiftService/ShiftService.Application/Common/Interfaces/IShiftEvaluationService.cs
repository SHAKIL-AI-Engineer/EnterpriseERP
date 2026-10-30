using ShiftService.Application.DTOs;

namespace ShiftService.Application.Common.Interfaces;

public interface IShiftEvaluationService
{
    Task<ShiftEvaluationDto> EvaluateAsync(Guid companyId, Guid employeeId, DateTime attendanceDate, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ShiftEvaluationDto>> EvaluateManyAsync(
        Guid companyId,
        IReadOnlyCollection<Guid> employeeIds,
        DateTime attendanceDate,
        CancellationToken cancellationToken = default);
}
