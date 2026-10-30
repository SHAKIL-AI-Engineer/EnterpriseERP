using MediatR;
using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Application.DTOs;

namespace ShiftService.Application.Features.Shifts.Queries;

public record GetShiftDetailQuery(Guid Id) : IRequest<ShiftDetailDto?>;
public record GetShiftPolicyQuery(Guid ShiftId) : IRequest<ShiftPolicyDto>;
public record GetShiftBreaksQuery(Guid ShiftId) : IRequest<IReadOnlyList<ShiftBreakDto>>;
public record EvaluateShiftQuery(Guid CompanyId, Guid EmployeeId, DateTime Date) : IRequest<ShiftEvaluationDto>;
public record EvaluateManyShiftsQuery(Guid CompanyId, IReadOnlyCollection<Guid> EmployeeIds, DateTime Date)
    : IRequest<IReadOnlyList<ShiftEvaluationDto>>;

public class ShiftDetailQueryHandlers(
    IShiftDbContext db,
    IShiftEvaluationService evaluation) :
    IRequestHandler<GetShiftDetailQuery, ShiftDetailDto?>,
    IRequestHandler<GetShiftPolicyQuery, ShiftPolicyDto>,
    IRequestHandler<GetShiftBreaksQuery, IReadOnlyList<ShiftBreakDto>>,
    IRequestHandler<EvaluateShiftQuery, ShiftEvaluationDto>,
    IRequestHandler<EvaluateManyShiftsQuery, IReadOnlyList<ShiftEvaluationDto>>
{
    public async Task<ShiftDetailDto?> Handle(GetShiftDetailQuery request, CancellationToken cancellationToken)
    {
        var shift = await db.Shifts.AsNoTracking().FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (shift is null) return null;

        var policy = await ShiftPolicyProvisioning.EnsurePolicyAsync(db, request.Id, cancellationToken);
        var breaks = await ShiftPolicyProvisioning.EnsureBreaksAsync(db, request.Id, cancellationToken);

        return new ShiftDetailDto(ShiftDtoMapping.ToDto(shift), policy, breaks);
    }

    public Task<ShiftPolicyDto> Handle(GetShiftPolicyQuery request, CancellationToken cancellationToken) =>
        ShiftPolicyProvisioning.EnsurePolicyAsync(db, request.ShiftId, cancellationToken);

    public Task<IReadOnlyList<ShiftBreakDto>> Handle(GetShiftBreaksQuery request, CancellationToken cancellationToken) =>
        ShiftPolicyProvisioning.EnsureBreaksAsync(db, request.ShiftId, cancellationToken);

    public Task<ShiftEvaluationDto> Handle(EvaluateShiftQuery request, CancellationToken cancellationToken) =>
        evaluation.EvaluateAsync(request.CompanyId, request.EmployeeId, request.Date, cancellationToken);

    public Task<IReadOnlyList<ShiftEvaluationDto>> Handle(EvaluateManyShiftsQuery request, CancellationToken cancellationToken) =>
        evaluation.EvaluateManyAsync(request.CompanyId, request.EmployeeIds, request.Date, cancellationToken);
}
