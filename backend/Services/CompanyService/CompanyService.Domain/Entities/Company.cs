namespace CompanyService.Domain.Entities;

public sealed class Company
{
    public Guid Id { get; set; }

    public string CompanyNameEn { get; set; } = string.Empty;
    public string? CompanyNameBn { get; set; }

    public string? AddressEn { get; set; }
    public string? AddressBn { get; set; }

    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }

    public string? TradeLicenseNo { get; set; }
    public string? BIN { get; set; }
    public string? TIN { get; set; }

    public string? LogoUrl { get; set; }
    public string? AuthorizeSignatureUrl { get; set; }

    public string? Industry { get; set; }
    public int? FoundedYear { get; set; }

    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
