namespace CompanyService.Application.Companies;

/// <summary>Optional uploaded file passed from the API layer without ASP.NET types in Application.</summary>
public sealed class CompanyFilePayload
{
    public required Stream Content { get; init; }
    public required string ContentType { get; init; }
    public required string FileName { get; init; }
}
