namespace HRService.Domain.Entities;

public sealed class EmployeeEmergencyContact
{
    public Guid Id { get; set; }

    public Guid EmployeeId { get; set; }

    public Employee? Employee { get; set; }

    public string ContactName { get; set; } = string.Empty;

    public string? Relation { get; set; }

    public string Phone { get; set; } = string.Empty;

    public string? Address { get; set; }
}
