namespace LeaveService.Domain.Entities;

public sealed class Holiday
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public DateOnly HolidayDate { get; set; }
    public string HolidayName { get; set; } = string.Empty;
    public string HolidayType { get; set; } = string.Empty;
    public bool IsPaid { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}
