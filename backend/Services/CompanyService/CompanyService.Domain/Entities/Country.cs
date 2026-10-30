namespace CompanyService.Domain.Entities;

public sealed class Country
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty; // ISO Code e.g., BD
    public bool IsActive { get; set; } = true;
}
