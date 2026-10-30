using Microsoft.AspNetCore.Mvc;

namespace CompanyService.Api.Models;

public sealed class CreateCompanyFormRequest
{
    public string CompanyNameEn { get; set; } = string.Empty;
    public string? CompanyNameBn { get; set; }
    public string? AddressEn { get; set; }
    public string? AddressBn { get; set; }
    public string? Email { get; set; }

    [FromForm(Name = "phoneNumber")]
    public string? Phone { get; set; }

    [FromForm(Name = "registrationNo")]
    public string? TradeLicenseNo { get; set; }
    public string? Industry { get; set; }

    [FromForm(Name = "founded")]
    public int? FoundedYear { get; set; }

    public string Status { get; set; } = "Active";
    public IFormFile? Logo { get; set; }
    public IFormFile? AuthorizeSignature { get; set; }
}

public sealed class UpdateCompanyFormRequest
{
    public string CompanyNameEn { get; set; } = string.Empty;
    public string? CompanyNameBn { get; set; }
    public string? AddressEn { get; set; }
    public string? AddressBn { get; set; }
    public string? Email { get; set; }

    [FromForm(Name = "phoneNumber")]
    public string? Phone { get; set; }

    [FromForm(Name = "registrationNo")]
    public string? TradeLicenseNo { get; set; }

    public string? Industry { get; set; }

    [FromForm(Name = "founded")]
    public int? FoundedYear { get; set; }
    public string Status { get; set; } = "Active";
    public IFormFile? Logo { get; set; }
    public IFormFile? AuthorizeSignature { get; set; }
}
