namespace AuthService.Infrastructure.Entities;

public sealed class UserAccountApproval
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid RequestedBy { get; set; }
    public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;
    public string RolesJson { get; set; } = "[]";
    public string CompaniesJson { get; set; } = "[]";
    public string Status { get; set; } = "Pending";
    public Guid? ReviewedBy { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string Reason { get; set; } = "";
    public byte[] Version { get; set; } = [];
}
