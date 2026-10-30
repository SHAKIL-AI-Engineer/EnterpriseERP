using CompanyService.Application.Companies;
using Erp.BuildingBlocks.ImageProcessing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace CompanyService.Infrastructure.Storage;

public sealed class CompanyFileStorage(IHostEnvironment environment, IConfiguration configuration) : ICompanyFileStorage
{
    private const long MaxUploadBytes = 5 * 1024 * 1024;
    private const long MaxStoredBytes = 512 * 1024;
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
    };

    public async Task<string> SaveLogoAsync(Guid companyId, CompanyFilePayload file, CancellationToken cancellationToken = default)
    {
        Validate(file);
        using var optimized = await UploadedImageOptimizer.OptimizeAsync(
            file.Content,
            file.ContentType,
            ImageUploadProfile.Logo,
            cancellationToken);
        EnsureStoredSize(optimized.Stream.Length);
        var fileName = $"logo{optimized.FileExtension}";
        await SaveToDiskAsync(companyId, fileName, optimized.Stream, cancellationToken);
        return $"/uploads/companies/{companyId:D}/{fileName}";
    }

    public async Task<string> SaveSignatureAsync(Guid companyId, CompanyFilePayload file, CancellationToken cancellationToken = default)
    {
        Validate(file);
        using var optimized = await UploadedImageOptimizer.OptimizeAsync(
            file.Content,
            file.ContentType,
            ImageUploadProfile.Signature,
            cancellationToken);
        EnsureStoredSize(optimized.Stream.Length);
        var fileName = $"signature{optimized.FileExtension}";
        await SaveToDiskAsync(companyId, fileName, optimized.Stream, cancellationToken);
        return $"/uploads/companies/{companyId:D}/{fileName}";
    }

    public Task DeleteCompanyFilesAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var dir = GetCompanyDirectory(companyId);
        if (Directory.Exists(dir))
        {
            Directory.Delete(dir, recursive: true);
        }

        return Task.CompletedTask;
    }

    private async Task SaveToDiskAsync(Guid companyId, string fileName, Stream content, CancellationToken cancellationToken)
    {
        var dir = GetCompanyDirectory(companyId);
        Directory.CreateDirectory(dir);

        var baseName = Path.GetFileNameWithoutExtension(fileName);
        foreach (var existing in Directory.EnumerateFiles(dir, $"{baseName}.*"))
        {
            File.Delete(existing);
        }

        var fullPath = Path.Combine(dir, fileName);
        await using var fs = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(fs, cancellationToken);
    }

    private string GetCompanyDirectory(Guid companyId)
    {
        var uploadRoot = configuration["CompanyFiles:UploadRoot"] ?? "uploads";
        var root = Path.IsPathRooted(uploadRoot)
            ? uploadRoot
            : Path.Combine(environment.ContentRootPath, uploadRoot);
        return Path.Combine(root, "companies", companyId.ToString("D"));
    }

    private static void Validate(CompanyFilePayload file)
    {
        if (file.Content.CanSeek && file.Content.Length > MaxUploadBytes)
        {
            throw new InvalidOperationException("File size must not exceed 5 MB before processing.");
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException("Only JPEG, PNG, and WebP images are allowed.");
        }
    }

    private static void EnsureStoredSize(long length)
    {
        if (length > MaxStoredBytes)
        {
            throw new InvalidOperationException("Image is still too large after optimization. Try a smaller source file.");
        }
    }
}
