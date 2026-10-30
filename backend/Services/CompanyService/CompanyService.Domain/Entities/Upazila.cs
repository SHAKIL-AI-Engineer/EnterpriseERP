namespace CompanyService.Domain.Entities;

public sealed class Upazila
{
    public Guid Id { get; set; }
    public Guid DistrictId { get; set; }
    public District? District { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
