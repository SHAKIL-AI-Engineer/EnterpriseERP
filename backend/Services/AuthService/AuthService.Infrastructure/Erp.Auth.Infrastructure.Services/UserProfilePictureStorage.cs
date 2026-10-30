using AuthService.Application.Abstractions.Authentication;

using AuthService.Infrastructure.Options;

using Erp.BuildingBlocks.ImageProcessing;

using Microsoft.AspNetCore.Hosting;

using Microsoft.Extensions.Options;



namespace AuthService.Infrastructure.Services;



public sealed class UserProfilePictureStorage(

	IWebHostEnvironment environment,

	IOptions<UserProfileOptions> options) : IUserProfilePictureStorage

{

	private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)

	{

		"image/jpeg",

		"image/png",

		"image/webp",

	};



	public async Task<string> SaveAsync(

		Guid userId,

		Stream content,

		string contentType,

		CancellationToken cancellationToken = default)

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



		using var optimized = await UploadedImageOptimizer.OptimizeAsync(

			content,

			contentType,

			ImageUploadProfile.Avatar,

			cancellationToken);

		if (optimized.Stream.Length > opts.MaxFileBytes)

		{

			throw new InvalidOperationException("Image is still too large after optimization. Try a smaller source file.");

		}



		var relativeFolder = $"{opts.UploadRoot.Trim('/')}/{userId:N}";

		var absoluteFolder = Path.Combine(environment.ContentRootPath, relativeFolder.Replace('/', Path.DirectorySeparatorChar));

		Directory.CreateDirectory(absoluteFolder);



		foreach (var existing in Directory.EnumerateFiles(absoluteFolder, "profile.*"))

		{

			File.Delete(existing);

		}



		var fileName = $"profile{optimized.FileExtension}";

		var absolutePath = Path.Combine(absoluteFolder, fileName);

		await using (var fileStream = new FileStream(absolutePath, FileMode.Create, FileAccess.Write, FileShare.None))

		{

			await optimized.Stream.CopyToAsync(fileStream, cancellationToken);

		}



		return $"/{relativeFolder}/{fileName}".Replace('\\', '/');

	}



	public Task DeleteIfExistsAsync(string? relativeUrl, CancellationToken cancellationToken = default)

	{

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

}


