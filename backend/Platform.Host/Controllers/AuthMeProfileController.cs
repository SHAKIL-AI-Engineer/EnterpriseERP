using System.Security.Claims;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Contracts.Auth;
using AuthService.Contracts.Common;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseERP.Platform.Host.Controllers;

/// <summary>Profile and password endpoints hosted on Platform.Host (always loaded with the running gateway).</summary>
[ApiController]
[Route("api/v1/auth")]
[Authorize]
public sealed class AuthMeProfileController(
	IAuthService authService,
	IValidator<UpdateUserProfileRequest> updateProfileValidator,
	IValidator<ChangePasswordRequest> changePasswordValidator) : ControllerBase
{
	private string TraceId =>
		HttpContext.Items.TryGetValue("CorrelationId", out var value) && value is string text
			? text
			: HttpContext.TraceIdentifier;

	[HttpPut("me/profile")]
	[ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
	public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileRequest request, CancellationToken cancellationToken)
	{
		var userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToError(new ApiError("AUTH_INVALID", "Missing user id claim.")));
		}

		var validation = await updateProfileValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ToErrors(validation));
		}

		var (profile, errors) = await authService.UpdateProfileAsync(userId.Value, request, cancellationToken);
		if (profile is null)
		{
			return BadRequest(ToErrors(errors.Select(e => new ApiError("PROFILE_UPDATE", e))));
		}

		return Ok(ApiResponse<UserProfileResponse>.Ok(profile, TraceId));
	}

	[HttpPost("me/profile-picture")]
	[Consumes("multipart/form-data")]
	[RequestSizeLimit(6 * 1024 * 1024)]
	[RequestFormLimits(MultipartBodyLengthLimit = 6 * 1024 * 1024)]
	[ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
	public async Task<IActionResult> UploadProfilePicture(IFormFile? file, CancellationToken cancellationToken)
	{
		var userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToError(new ApiError("AUTH_INVALID", "Missing user id claim.")));
		}

		file ??= Request.Form.Files.GetFile("file") ?? Request.Form.Files.FirstOrDefault();
		if (file is null || file.Length == 0)
		{
			return BadRequest(ToError(new ApiError("FILE_REQUIRED", "Profile picture file is required.")));
		}

		await using var stream = file.OpenReadStream();
		var (profile, errors) = await authService.UpdateProfilePictureAsync(
			userId.Value,
			stream,
			file.ContentType,
			cancellationToken);
		if (profile is null)
		{
			return BadRequest(ToErrors(errors.Select(e => new ApiError("PROFILE_PICTURE", e))));
		}

		return Ok(ApiResponse<UserProfileResponse>.Ok(profile, TraceId));
	}

	[HttpDelete("me/profile-picture")]
	[ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
	public async Task<IActionResult> RemoveProfilePicture(CancellationToken cancellationToken)
	{
		var userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToError(new ApiError("AUTH_INVALID", "Missing user id claim.")));
		}

		var (profile, errors) = await authService.RemoveProfilePictureAsync(userId.Value, cancellationToken);
		if (profile is null)
		{
			return BadRequest(ToErrors(errors.Select(e => new ApiError("PROFILE_PICTURE", e))));
		}

		return Ok(ApiResponse<UserProfileResponse>.Ok(profile, TraceId));
	}

	[HttpPut("me/password")]
	[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
	public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
	{
		var userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToError(new ApiError("AUTH_INVALID", "Missing user id claim.")));
		}

		var validation = await changePasswordValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ToErrors(validation));
		}

		var (ok, errors) = await authService.ChangePasswordAsync(userId.Value, request, cancellationToken);
		if (!ok)
		{
			return BadRequest(ToErrors(errors.Select(e => new ApiError("PASSWORD", e))));
		}

		return Ok(ApiResponse<object>.Ok(new { changed = true }, TraceId));
	}

	private Guid? GetUserIdOrDefault()
	{
		var input = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
		return Guid.TryParse(input, out var id) ? id : null;
	}

	private ApiResponse<object> ToError(ApiError error) => ApiResponse<object>.Fail(TraceId, [error]);

	private ApiResponse<object> ToErrors(IEnumerable<ApiError> errors) => ApiResponse<object>.Fail(TraceId, errors.ToList());

	private ApiResponse<object> ToErrors(ValidationResult validation) =>
		ApiResponse<object>.Fail(
			TraceId,
			validation.Errors.Select(e => new ApiError(e.PropertyName, e.ErrorMessage)).ToList());
}
