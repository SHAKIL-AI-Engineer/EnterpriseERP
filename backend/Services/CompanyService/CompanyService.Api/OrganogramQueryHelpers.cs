namespace CompanyService.Api;

internal static class OrganogramQueryHelpers
{
    /// <summary>
    /// Parses optional companyId query values without ASP.NET model-binding 400 on legacy numeric ids.
    /// </summary>
    public static Guid? ParseOptionalCompanyId(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var text = raw.Trim();
        if (Guid.TryParse(text, out var guid) && guid != Guid.Empty)
        {
            return guid;
        }

        return null;
    }
}
