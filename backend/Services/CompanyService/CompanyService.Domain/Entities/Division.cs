namespace CompanyService.Domain.Entities;

public sealed class Division
{
    public Guid Id { get; set; }
    public Guid CountryId { get; set; }
    public Country? Country { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
