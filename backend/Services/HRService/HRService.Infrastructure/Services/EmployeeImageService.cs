using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeImageService(HrDbContext db, IEmployeeImageStorage storage) : IEmployeeImageService
{
	public Task<(string? ImageUrl, IReadOnlyList<string> Errors)> UploadProfileImageAsync(
		Guid employeeId,
		Stream content,
		string contentType,
		CancellationToken cancellationToken = default) =>
		UploadAsync(employeeId, EmployeeDocumentTypes.ProfileImage, content, contentType, storage.SaveProfileImageAsync, cancellationToken);

	public Task<(string? ImageUrl, IReadOnlyList<string> Errors)> UploadSignatureAsync(
		Guid employeeId,
		Stream content,
		string contentType,
		CancellationToken cancellationToken = default) =>
		UploadAsync(employeeId, EmployeeDocumentTypes.Signature, content, contentType, storage.SaveSignatureAsync, cancellationToken);

	public Task<IReadOnlyList<string>> RemoveProfileImageAsync(Guid employeeId, CancellationToken cancellationToken = default) =>
		RemoveAsync(employeeId, EmployeeDocumentTypes.ProfileImage, cancellationToken);

	public Task<IReadOnlyList<string>> RemoveSignatureAsync(Guid employeeId, CancellationToken cancellationToken = default) =>
		RemoveAsync(employeeId, EmployeeDocumentTypes.Signature, cancellationToken);

	private async Task<(string? ImageUrl, IReadOnlyList<string> Errors)> UploadAsync(
		Guid employeeId,
		string documentType,
		Stream content,
		string contentType,
		Func<Guid, Stream, string, CancellationToken, Task<string>> save,
		CancellationToken cancellationToken)
	{
		var employee = await db.Employees.AsNoTracking()
			.FirstOrDefaultAsync(e => e.Id == employeeId && !e.IsDeleted, cancellationToken);
		if (employee is null)
		{
			return (null, ["Employee not found."]);
		}

		try
		{
			var relativeUrl = await save(employeeId, content, contentType, cancellationToken);
			await UpsertDocumentAsync(employeeId, documentType, relativeUrl, cancellationToken);
			return (relativeUrl, []);
		}
		catch (InvalidOperationException ex)
		{
			return (null, [ex.Message]);
		}
	}

	private async Task<IReadOnlyList<string>> RemoveAsync(
		Guid employeeId,
		string documentType,
		CancellationToken cancellationToken)
	{
		var employee = await db.Employees.AsNoTracking()
			.FirstOrDefaultAsync(e => e.Id == employeeId && !e.IsDeleted, cancellationToken);
		if (employee is null)
		{
			return ["Employee not found."];
		}

		var doc = await db.EmployeeDocuments
			.FirstOrDefaultAsync(
				d => d.EmployeeId == employeeId &&
				     d.DocumentType == documentType,
				cancellationToken);
		if (doc is null)
		{
			return [];
		}

		await storage.DeleteIfExistsAsync(doc.FileUrl, cancellationToken);
		db.EmployeeDocuments.Remove(doc);
		await db.SaveChangesAsync(cancellationToken);
		return [];
	}

	private async Task UpsertDocumentAsync(
		Guid employeeId,
		string documentType,
		string fileUrl,
		CancellationToken cancellationToken)
	{
		var existing = await db.EmployeeDocuments
			.FirstOrDefaultAsync(
				d => d.EmployeeId == employeeId &&
				     d.DocumentType == documentType,
				cancellationToken);

		if (existing is not null)
		{
			if (!string.Equals(existing.FileUrl, fileUrl, StringComparison.OrdinalIgnoreCase))
			{
				await storage.DeleteIfExistsAsync(existing.FileUrl, cancellationToken);
				existing.FileUrl = fileUrl;
			}

			existing.UploadedAt = DateTime.Now;
		}
		else
		{
			db.EmployeeDocuments.Add(new EmployeeDocument
			{
				Id = Guid.NewGuid(),
				EmployeeId = employeeId,
				DocumentType = documentType,
				FileUrl = fileUrl,
				UploadedAt = DateTime.Now,
			});
		}

		await db.SaveChangesAsync(cancellationToken);
	}
}
