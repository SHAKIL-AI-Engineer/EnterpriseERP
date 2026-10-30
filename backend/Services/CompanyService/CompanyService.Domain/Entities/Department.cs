namespace CompanyService.Domain.Entities;

public sealed class Department
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
