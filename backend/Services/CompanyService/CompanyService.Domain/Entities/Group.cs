namespace CompanyService.Domain.Entities;

public sealed class Group
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
