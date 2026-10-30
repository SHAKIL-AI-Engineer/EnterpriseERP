namespace HRService.Domain.Entities;

public sealed class Grade
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int? Level { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public Guid? CreatedBy { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public Guid? DeletedBy { get; set; }
}
