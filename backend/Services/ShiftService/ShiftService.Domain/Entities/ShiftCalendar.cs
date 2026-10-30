namespace ShiftService.Domain.Entities;

public sealed class ShiftCalendar
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid? EmployeeId { get; set; }
    public Guid? ShiftId { get; set; }

    public DateTime CalendarDate { get; set; }
    public string DayType { get; set; } = string.Empty; // WorkingDay, WeeklyOff, Holiday, SpecialWorkingDay
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}
