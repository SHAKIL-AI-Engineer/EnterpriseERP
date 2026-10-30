namespace HRService.Domain.Entities;

public sealed class EmployeeAddress
{
    public Guid Id { get; set; }

    public Guid EmployeeId { get; set; }

    public Employee? Employee { get; set; }

    public string AddressType { get; set; } = string.Empty; // e.g., Present, Permanent

    public string Country { get; set; } = "Bangladesh";

    public string? Division { get; set; }

    public string? District { get; set; }

    public string? Upazila { get; set; }

    public string? PostOffice { get; set; }

    public string? PostalCode { get; set; }

    public string? AddressLine { get; set; }
}
