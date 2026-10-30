namespace CompanyService.Domain.Entities;

public sealed class Section
{
    public Guid Id { get; set; }
    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
