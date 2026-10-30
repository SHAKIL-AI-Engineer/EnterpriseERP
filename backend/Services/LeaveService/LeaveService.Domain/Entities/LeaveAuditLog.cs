namespace LeaveService.Domain.Entities;

public sealed class LeaveAuditLog
{
    public Guid Id { get; set; }
    public Guid? CompanyId { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}
