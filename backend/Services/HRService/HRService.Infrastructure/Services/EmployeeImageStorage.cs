using Erp.BuildingBlocks.ImageProcessing;

using HRService.Application.Employees;

using HRService.Infrastructure.Options;

using Microsoft.AspNetCore.Hosting;

using Microsoft.Extensions.Options;



namespace HRService.Infrastructure.Services;



public sealed class EmployeeImageStorage(

	IWebHostEnvironment environment,

	IOptions<EmployeeImageOptions> options) : IEmployeeImageStorage

{

	private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)

	{

		"image/jpeg",

		"image/png",

		"image/webp",

	};



	public Task<string> SaveProfileImageAsync(

		Guid employeeId,

		Stream content,

		string contentType,

		CancellationToken cancellationToken = default) =>

		SaveAsync(employeeId, "profile", content, contentType, ImageUploadProfile.Avatar, cancellationToken);



	public Task<string> SaveSignatureAsync(

		Guid employeeId,

		Stream content,

		string contentType,

		CancellationToken cancellationToken = default) =>

		SaveAsync(employeeId, "signature", content, contentType, ImageUploadProfile.Signature, cancellationToken);



	public Task DeleteIfExistsAsync(string? relativeUrl, CancellationToken cancellationToken = default)

	{

		_ = cancellationToken;

		if (string.IsNullOrWhiteSpace(relativeUrl))

		{

			return Task.CompletedTask;

		}



		var normalized = relativeUrl.Trim().TrimStart('/');

		var absolutePath = Path.Combine(environment.ContentRootPath, normalized.Replace('/', Path.DirectorySeparatorChar));

		if (File.Exists(absolutePath))

		{

			File.Delete(absolutePath);

		}



		return Task.CompletedTask;

	}



	private async Task<string> SaveAsync(

		Guid employeeId,

		string baseName,

		Stream content,

		string contentType,

		ImageUploadProfile profile,

		CancellationToken cancellationToken)

	{

		if (!AllowedContentTypes.Contains(contentType))

		{

			throw new InvalidOperationException("Only JPG, PNG, or WebP images are allowed.");

		}



		var opts = options.Value;

		if (content.CanSeek && content.Length > opts.MaxUploadBytes)

		{

			throw new InvalidOperationException($"Image must be {opts.MaxUploadBytes / (1024 * 1024)} MB or smaller before processing.");

		}



		using var optimized = await UploadedImageOptimizer.OptimizeAsync(content, contentType, profile, cancellationToken);

		if (optimized.Stream.Length > opts.MaxFileBytes)

		{

			throw new InvalidOperationException("Image is still too large after optimization. Try a smaller source file.");

		}



		var relativeFolder = $"{opts.UploadRoot.Trim('/')}/{employeeId:N}";

		var absoluteFolder = Path.Combine(environment.ContentRootPath, relativeFolder.Replace('/', Path.DirectorySeparatorChar));

		Directory.CreateDirectory(absoluteFolder);



		foreach (var existing in Directory.EnumerateFiles(absoluteFolder, $"{baseName}.*"))

		{

			File.Delete(existing);

		}



		var fileName = $"{baseName}{optimized.FileExtension}";

		var absolutePath = Path.Combine(absoluteFolder, fileName);

		await using (var fileStream = new FileStream(absolutePath, FileMode.Create, FileAccess.Write, FileShare.None))

		{

			await optimized.Stream.CopyToAsync(fileStream, cancellationToken);

		}



		return $"/{relativeFolder}/{fileName}".Replace('\\', '/');

	}

}


