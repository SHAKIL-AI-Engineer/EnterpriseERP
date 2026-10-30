using MediatR;
using ShiftService.Application.DTOs;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Domain.Entities;

namespace ShiftService.Application.Features.Shifts.Queries;

public record GetApplicableShiftQuery(Guid CompanyId, Guid EmployeeId, DateTime AttendanceDate) : IRequest<ShiftDto?>;

public class GetApplicableShiftQueryHandler(IShiftSelectionService selectionService) : IRequestHandler<GetApplicableShiftQuery, ShiftDto?>
{
    public async Task<ShiftDto?> Handle(GetApplicableShiftQuery request, CancellationToken cancellationToken)
    {
        var shift = await selectionService.GetApplicableShiftAsync(request.CompanyId, request.EmployeeId, request.AttendanceDate);
        
        if (shift == null) return null;

        return ShiftDtoMapping.ToDto(shift);
    }
}
