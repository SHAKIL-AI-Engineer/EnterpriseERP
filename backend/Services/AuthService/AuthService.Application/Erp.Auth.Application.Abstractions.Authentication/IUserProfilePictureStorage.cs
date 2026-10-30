namespace AuthService.Application.Abstractions.Authentication;

public interface IUserProfilePictureStorage
{
	Task<string> SaveAsync(Guid userId, Stream content, string contentType, CancellationToken cancellationToken = default);

	Task DeleteIfExistsAsync(string? relativeUrl, CancellationToken cancellationToken = default);
}
