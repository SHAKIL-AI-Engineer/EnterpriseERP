using CompanyService.Application.Companies;

namespace CompanyService.Api.Helpers;

internal static class CompanyFormFileHelper
{
    private const long MaxFileBytes = 2 * 1024 * 1024;

    public static async Task<CompanyFilePayload?> ToPayloadAsync(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return null;
        }

        if (file.Length > MaxFileBytes)
        {
            throw new InvalidOperationException("File size must not exceed 2 MB.");
        }

        var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        stream.Position = 0;

        return new CompanyFilePayload
        {
            Content = stream,
            ContentType = file.ContentType,
            FileName = file.FileName,
        };
    }
}
