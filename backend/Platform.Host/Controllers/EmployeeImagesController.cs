using Erp.BuildingBlocks.CommonResponses;
using Erp.BuildingBlocks.CommonSecurity;
using HRService.Application.Employees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseERP.Platform.Host.Controllers;

/// <summary>Employee profile/signature uploads hosted on Platform.Host (always loaded with the running gateway).</summary>
[ApiController]
[Route("api/v1/hr/Employees")]
[Authorize]
public sealed class EmployeeImagesController(
	IEmployeeReadService employees,
	IEmployeeImageService employeeImages,
	ITenantContext tenant) : ControllerBase
{
	[HttpPost("{id:guid}/profile-picture")]
	[Authorize(Policy = "Permission:hr.employees.write")]
	[Consumes("multipart/form-data")]
	[RequestSizeLimit(6 * 1024 * 1024)]
	[RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
	[ProducesResponseType(typeof(ApiResponse<EmployeeImageResponse>), StatusCodes.Status200OK)]
	public async Task<IActionResult> UploadProfilePicture(
		Guid id,
		IFormFile? file,
		CancellationToken cancellationToken)
	{
		var access = await EnsureEmployeeWriteAccessAsync(id, cancellationToken);
		if (access is not null)
		{
			return access;
		}

		file ??= Request.Form.Files.GetFile("file") ?? Request.Form.Files.FirstOrDefault();
		if (file is null || file.Length == 0)
		{
			return BadRequest(ApiResponse<EmployeeImageResponse>.Fail(
				HttpContext.TraceIdentifier,
				[new ApiError("FILE_REQUIRED", "Profile picture file is required.")]));
		}

		await using var stream = file.OpenReadStream();
		var (imageUrl, errors) = await employeeImages.UploadProfileImageAsync(
			id,
			stream,
			file.ContentType,
			cancellationToken);
		if (imageUrl is null)
		{
			return BadRequest(ApiResponse<EmployeeImageResponse>.Fail(
				HttpContext.TraceIdentifier,
				errors.Select(e => new ApiError("PROFILE_IMAGE", e)).ToList()));
		}

		return Ok(ApiResponse<EmployeeImageResponse>.Ok(
			new EmployeeImageResponse(imageUrl),
			HttpContext.TraceIdentifier));
	}

	[HttpDelete("{id:guid}/profile-picture")]
	[Authorize(Policy = "Permission:hr.employees.write")]
	[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
	public async Task<IActionResult> RemoveProfilePicture(Guid id, CancellationToken cancellationToken)
	{
		var access = await EnsureEmployeeWriteAccessAsync(id, cancellationToken);
		if (access is not null)
		{
			return access;
		}

		var errors = await employeeImages.RemoveProfileImageAsync(id, cancellationToken);
		if (errors.Count > 0)
		{
			return BadRequest(ApiResponse<object>.Fail(
				HttpContext.TraceIdentifier,
				errors.Select(e => new ApiError("PROFILE_IMAGE", e)).ToList()));
		}

		return Ok(ApiResponse<object>.Ok(new { removed = true }, HttpContext.TraceIdentifier));
	}

	[HttpPost("{id:guid}/signature")]
	[Authorize(Policy = "Permission:hr.employees.write")]
	[Consumes("multipart/form-data")]
	[RequestSizeLimit(6 * 1024 * 1024)]
	[RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
	[ProducesResponseType(typeof(ApiResponse<EmployeeImageResponse>), StatusCodes.Status200OK)]
	public async Task<IActionResult> UploadSignature(
		Guid id,
		IFormFile? file,
		CancellationToken cancellationToken)
	{
		var access = await EnsureEmployeeWriteAccessAsync(id, cancellationToken);
		if (access is not null)
		{
			return access;
		}

		file ??= Request.Form.Files.GetFile("file") ?? Request.Form.Files.FirstOrDefault();
		if (file is null || file.Length == 0)
		{
			return BadRequest(ApiResponse<EmployeeImageResponse>.Fail(
				HttpContext.TraceIdentifier,
				[new ApiError("FILE_REQUIRED", "Signature image file is required.")]));
		}

		await using var stream = file.OpenReadStream();
		var (imageUrl, errors) = await employeeImages.UploadSignatureAsync(
			id,
			stream,
			file.ContentType,
			cancellationToken);
		if (imageUrl is null)
		{
			return BadRequest(ApiResponse<EmployeeImageResponse>.Fail(
				HttpContext.TraceIdentifier,
				errors.Select(e => new ApiError("SIGNATURE", e)).ToList()));
		}

		return Ok(ApiResponse<EmployeeImageResponse>.Ok(
			new EmployeeImageResponse(imageUrl),
			HttpContext.TraceIdentifier));
	}

	[HttpDelete("{id:guid}/signature")]
	[Authorize(Policy = "Permission:hr.employees.write")]
	[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
	public async Task<IActionResult> RemoveSignature(Guid id, CancellationToken cancellationToken)
	{
		var access = await EnsureEmployeeWriteAccessAsync(id, cancellationToken);
		if (access is not null)
		{
			return access;
		}

		var errors = await employeeImages.RemoveSignatureAsync(id, cancellationToken);
		if (errors.Count > 0)
		{
			return BadRequest(ApiResponse<object>.Fail(
				HttpContext.TraceIdentifier,
				errors.Select(e => new ApiError("SIGNATURE", e)).ToList()));
		}

		return Ok(ApiResponse<object>.Ok(new { removed = true }, HttpContext.TraceIdentifier));
	}

	private async Task<IActionResult?> EnsureEmployeeWriteAccessAsync(Guid id, CancellationToken cancellationToken)
	{
		var data = await employees.GetByIdAsync(id, cancellationToken);
		if (data is null)
		{
			return NotFound(ApiResponse<object>.Fail(
				HttpContext.TraceIdentifier,
				[new ApiError("NotFound", "Employee not found")]));
		}

		if (!tenant.HasAccessToCompany(data.CompanyId))
		{
			return Forbid();
		}

		return null;
	}
}
