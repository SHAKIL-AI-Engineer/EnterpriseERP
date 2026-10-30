using Microsoft.EntityFrameworkCore;
using ShiftService.Domain.Entities;

namespace ShiftService.Application.Common.Interfaces;

public interface IShiftDbContext
{
    DbSet<Shift> Shifts { get; }
    DbSet<ShiftRule> ShiftRules { get; }
    DbSet<ShiftBreak> ShiftBreaks { get; }
    DbSet<EmployeeShiftAssignment> EmployeeShiftAssignments { get; }
    DbSet<TemporaryShiftAssignment> TemporaryShiftAssignments { get; }
    DbSet<ShiftCalendar> ShiftCalendars { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
