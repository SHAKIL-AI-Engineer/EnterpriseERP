using MediatR;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Domain.Entities;
using ShiftService.Application.DTOs;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace ShiftService.Application.Features.Shifts.Commands;

public record CreateShiftCalendarCommand(
    Guid CompanyId, Guid? EmployeeId, Guid? ShiftId, DateTime CalendarDate,
    string DayType, string? Remarks) : IRequest<Guid>;

public class CalendarHandler(IShiftDbContext db) : IRequestHandler<CreateShiftCalendarCommand, Guid>
{
    public async Task<Guid> Handle(CreateShiftCalendarCommand request, CancellationToken cancellationToken)
    {
        var calendar = new ShiftCalendar
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            EmployeeId = request.EmployeeId,
            ShiftId = request.ShiftId,
            CalendarDate = request.CalendarDate.Date,
            DayType = request.DayType,
            Remarks = request.Remarks,
            CreatedAt = BusinessTime.Now
        };

        db.ShiftCalendars.Add(calendar);
        await db.SaveChangesAsync(cancellationToken);
        return calendar.Id;
    }
}
