namespace CompanyService.Domain.Entities;

public sealed class PostOffice
{
    public Guid Id { get; set; }
    public Guid UpazilaId { get; set; }
    public Upazila? Upazila { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
