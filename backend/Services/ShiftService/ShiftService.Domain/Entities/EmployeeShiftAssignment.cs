namespace ShiftService.Domain.Entities;

public sealed class EmployeeShiftAssignment
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ShiftId { get; set; }
    public Shift? Shift { get; set; }

    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsCurrent { get; set; }

    public Guid? AssignedBy { get; set; }
    public DateTime AssignedAt { get; set; }
}
