using MediatR;
using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Application.DTOs;

namespace ShiftService.Application.Features.Shifts.Queries;

public record GetShiftsByCompanyQuery(Guid CompanyId) : IRequest<IEnumerable<ShiftDto>>;

public class GetShiftsByCompanyQueryHandler(IShiftDbContext db) : IRequestHandler<GetShiftsByCompanyQuery, IEnumerable<ShiftDto>>
{
    public async Task<IEnumerable<ShiftDto>> Handle(GetShiftsByCompanyQuery request, CancellationToken cancellationToken)
    {
        var shifts = await db.Shifts
            .AsNoTracking()
            .Where(s => s.CompanyId == request.CompanyId)
            .ToListAsync(cancellationToken);
        return shifts.Select(ShiftDtoMapping.ToDto);
    }
}
