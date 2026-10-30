using MediatR;
using Microsoft.EntityFrameworkCore;
using Erp.BuildingBlocks.Contracts.Pagination;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Application.DTOs;

namespace ShiftService.Application.Features.Shifts.Queries;

public record GetShiftByIdQuery(Guid Id) : IRequest<ShiftDto?>;
public record GetCurrentEmployeeShiftQuery(Guid EmployeeId, Guid CompanyId) : IRequest<EmployeeShiftAssignmentDto?>;
public record GetEmployeeShiftHistoryQuery(Guid EmployeeId, Guid CompanyId) : IRequest<IEnumerable<EmployeeShiftAssignmentDto>>;
public record GetTemporaryShiftByDateQuery(Guid EmployeeId, Guid CompanyId, DateTime Date) : IRequest<TemporaryShiftAssignmentDto?>;
public record GetTemporaryShiftByIdQuery(Guid Id) : IRequest<TemporaryShiftAssignmentDto?>;
public record ListTemporaryShiftsQuery(
    Guid CompanyId,
    DateTime? FromDate,
    DateTime? ToDate,
    Guid? EmployeeId = null,
    int Page = 1,
    int PageSize = 20) : IRequest<PagedResult<TemporaryShiftAssignmentDto>>;
public record GetShiftCalendarQuery(Guid CompanyId, DateTime FromDate, DateTime ToDate) : IRequest<IEnumerable<ShiftCalendarDto>>;

public class ShiftQueryHandlers(IShiftDbContext db) :
    IRequestHandler<GetShiftByIdQuery, ShiftDto?>,
    IRequestHandler<GetCurrentEmployeeShiftQuery, EmployeeShiftAssignmentDto?>,
    IRequestHandler<GetEmployeeShiftHistoryQuery, IEnumerable<EmployeeShiftAssignmentDto>>,
    IRequestHandler<GetTemporaryShiftByDateQuery, TemporaryShiftAssignmentDto?>,
    IRequestHandler<GetTemporaryShiftByIdQuery, TemporaryShiftAssignmentDto?>,
    IRequestHandler<ListTemporaryShiftsQuery, PagedResult<TemporaryShiftAssignmentDto>>,
    IRequestHandler<GetShiftCalendarQuery, IEnumerable<ShiftCalendarDto>>
{
    public async Task<ShiftDto?> Handle(GetShiftByIdQuery request, CancellationToken cancellationToken)
    {
        var shift = await db.Shifts
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        return shift is null ? null : ShiftDtoMapping.ToDto(shift);
    }

    public async Task<EmployeeShiftAssignmentDto?> Handle(GetCurrentEmployeeShiftQuery request, CancellationToken cancellationToken)
    {
        return await db.EmployeeShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .Where(a => a.EmployeeId == request.EmployeeId && a.CompanyId == request.CompanyId && a.IsCurrent)
            .Select(a => new EmployeeShiftAssignmentDto(a.Id, a.EmployeeId, a.ShiftId, a.Shift!.ShiftName, a.EffectiveFrom, a.EffectiveTo, a.IsCurrent))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<EmployeeShiftAssignmentDto>> Handle(GetEmployeeShiftHistoryQuery request, CancellationToken cancellationToken)
    {
        return await db.EmployeeShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .Where(a => a.EmployeeId == request.EmployeeId && a.CompanyId == request.CompanyId)
            .OrderByDescending(a => a.EffectiveFrom)
            .Select(a => new EmployeeShiftAssignmentDto(a.Id, a.EmployeeId, a.ShiftId, a.Shift!.ShiftName, a.EffectiveFrom, a.EffectiveTo, a.IsCurrent))
            .ToListAsync(cancellationToken);
    }

    public async Task<TemporaryShiftAssignmentDto?> Handle(GetTemporaryShiftByDateQuery request, CancellationToken cancellationToken)
    {
        return await db.TemporaryShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .Where(a => a.EmployeeId == request.EmployeeId && a.CompanyId == request.CompanyId && a.ShiftDate.Date == request.Date.Date)
            .Select(a => new TemporaryShiftAssignmentDto(a.Id, a.EmployeeId, a.ShiftId, a.Shift!.ShiftName, a.ShiftDate, a.Reason, a.CompanyId))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TemporaryShiftAssignmentDto?> Handle(GetTemporaryShiftByIdQuery request, CancellationToken cancellationToken)
    {
        return await db.TemporaryShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .Where(a => a.Id == request.Id)
            .Select(a => new TemporaryShiftAssignmentDto(a.Id, a.EmployeeId, a.ShiftId, a.Shift!.ShiftName, a.ShiftDate, a.Reason, a.CompanyId))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<TemporaryShiftAssignmentDto>> Handle(ListTemporaryShiftsQuery request, CancellationToken cancellationToken)
    {
        var query = db.TemporaryShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .Where(a => a.CompanyId == request.CompanyId);

        if (request.EmployeeId.HasValue && request.EmployeeId.Value != Guid.Empty)
        {
            query = query.Where(a => a.EmployeeId == request.EmployeeId.Value);
        }

        if (request.FromDate.HasValue)
        {
            var from = request.FromDate.Value.Date;
            query = query.Where(a => a.ShiftDate >= from);
        }

        if (request.ToDate.HasValue)
        {
            var to = request.ToDate.Value.Date;
            query = query.Where(a => a.ShiftDate <= to);
        }

        var total = await query.CountAsync(cancellationToken);

        var ordered = query
            .OrderBy(a => a.ShiftDate)
            .ThenBy(a => a.EmployeeId);

        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize switch
        {
            0 => 0, // All
            < 1 => 20,
            > 200 => 200,
            _ => request.PageSize
        };

        var paged = pageSize == 0
            ? ordered
            : ordered.Skip((page - 1) * pageSize).Take(pageSize);

        var items = await paged
            .Select(a => new TemporaryShiftAssignmentDto(a.Id, a.EmployeeId, a.ShiftId, a.Shift!.ShiftName, a.ShiftDate, a.Reason, a.CompanyId))
            .ToListAsync(cancellationToken);

        return new PagedResult<TemporaryShiftAssignmentDto>
        {
            Items = items,
            TotalCount = total,
            Page = pageSize == 0 ? 1 : page,
            PageSize = pageSize == 0 ? total : pageSize
        };
    }

    public async Task<IEnumerable<ShiftCalendarDto>> Handle(GetShiftCalendarQuery request, CancellationToken cancellationToken)
    {
        return await db.ShiftCalendars
            .AsNoTracking()
            .Where(c => c.CompanyId == request.CompanyId && c.CalendarDate >= request.FromDate && c.CalendarDate <= request.ToDate)
            .Select(c => new ShiftCalendarDto(c.Id, c.EmployeeId, c.ShiftId, c.CalendarDate, c.DayType, c.Remarks))
            .ToListAsync(cancellationToken);
    }
}
