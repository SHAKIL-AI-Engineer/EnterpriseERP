namespace HRService.Domain.Entities;

public sealed class EmployeeTransfer
{
    public Guid Id { get; set; }

    public Guid EmployeeId { get; set; }

    public Employee Employee { get; set; } = null!;

    public Guid? FromDepartmentId { get; set; }

    public Guid? ToDepartmentId { get; set; }

    public DateTime EffectiveDate { get; set; }

    public string? Reason { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public Guid? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public Guid? DeletedBy { get; set; }
}
