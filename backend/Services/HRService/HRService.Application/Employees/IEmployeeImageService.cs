namespace HRService.Application.Employees;

public interface IEmployeeImageService
{
	Task<(string? ImageUrl, IReadOnlyList<string> Errors)> UploadProfileImageAsync(
		Guid employeeId,
		Stream content,
		string contentType,
		CancellationToken cancellationToken = default);

	Task<(string? ImageUrl, IReadOnlyList<string> Errors)> UploadSignatureAsync(
		Guid employeeId,
		Stream content,
		string contentType,
		CancellationToken cancellationToken = default);

	Task<IReadOnlyList<string>> RemoveProfileImageAsync(Guid employeeId, CancellationToken cancellationToken = default);

	Task<IReadOnlyList<string>> RemoveSignatureAsync(Guid employeeId, CancellationToken cancellationToken = default);
}
