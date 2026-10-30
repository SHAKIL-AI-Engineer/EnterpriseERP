namespace LeaveService.Domain.Entities;

public sealed class WeeklyOffRule
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string DayOfWeekName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
