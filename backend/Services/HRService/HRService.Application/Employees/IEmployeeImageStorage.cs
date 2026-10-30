namespace HRService.Application.Employees;

public interface IEmployeeImageStorage
{
	Task<string> SaveProfileImageAsync(
		Guid employeeId,
		Stream content,
		string contentType,
		CancellationToken cancellationToken = default);

	Task<string> SaveSignatureAsync(
		Guid employeeId,
		Stream content,
		string contentType,
		CancellationToken cancellationToken = default);

	Task DeleteIfExistsAsync(string? relativeUrl, CancellationToken cancellationToken = default);
}
