namespace CompanyService.Domain.Entities;

public sealed class Area
{
    public Guid Id { get; set; }
    public Guid PostOfficeId { get; set; }
    public PostOffice? PostOffice { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
