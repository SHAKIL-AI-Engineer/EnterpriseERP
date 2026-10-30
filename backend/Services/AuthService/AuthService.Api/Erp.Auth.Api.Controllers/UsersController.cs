using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Users;
using AuthService.Contracts.CompanyAccess;
using AuthService.Contracts.Common;
using AuthService.Contracts.Users;
using System.Security.Claims;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public sealed class UsersController(
	IUserAdminService userAdmin,
	ICompanyAccessAdminService companyAccessAdmin,
	IValidator<UpdateUserStatusRequest> statusValidator,
	IValidator<AssignUserRolesRequest> rolesValidator,
	IValidator<SetUserCompanyAccessRequest> companyValidator,
	ILogger<UsersController> logger) : ControllerBase
{
	private string TraceId
	{
		get
		{
			if (base.HttpContext.Items.TryGetValue("CorrelationId", out object? value) && value is string text)
			{
				return text;
			}
			return base.HttpContext.TraceIdentifier;
		}
	}

	[HttpGet]
	[Authorize(Policy = "Permission:auth.users.read")]
	public async Task<IActionResult> List(CancellationToken cancellationToken)
	{
		IReadOnlyList<UserListItemDto>? items;
		IReadOnlyList<string> _;
		(items, _) = await userAdmin.ListUsersAsync(cancellationToken);
		return Ok(ApiResponse<IReadOnlyList<UserListItemDto>>.Ok(items ?? Array.Empty<UserListItemDto>(), TraceId));
	}

	[HttpPut("{id:guid}/status")]
	[Authorize(Policy = "Permission:auth.users.write")]
	public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateUserStatusRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await statusValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		(bool ok, IReadOnlyList<string> errors) = await userAdmin.UpdateStatusAsync(id, request, cancellationToken);
		if (!ok)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, errors.Select((string e) => new ApiError("STATUS", e)).ToList()));
		}
		logger.LogInformation("Updated status for user {UserId}", id);
		return Ok(ApiResponse<object>.Ok(new { updated = true }, TraceId));
	}

	[HttpPost("{id:guid}/roles")]
	[Authorize(Policy = "Permission:auth.users.write")]
	public async Task<IActionResult> AssignRoles(Guid id, [FromBody] AssignUserRolesRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await rolesValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		(bool ok, IReadOnlyList<string> errors) = await userAdmin.AssignRolesAsync(id, request, cancellationToken);
		if (!ok)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, errors.Select((string e) => new ApiError("ROLES", e)).ToList()));
		}
		return Ok(ApiResponse<object>.Ok(new { updated = true }, TraceId));
	}

	[HttpPost("{id:guid}/companies")]
	[Authorize(Policy = "Permission:auth.users.write")]
	public async Task<IActionResult> SetCompanies(Guid id, [FromBody] SetUserCompanyAccessRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await companyValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		Guid? actor = GetActorUserId();
		if (!actor.HasValue)
		{
			return Unauthorized(ApiResponse<object>.Fail(TraceId, new ApiError[1]
			{
				new ApiError("AUTH_INVALID", "Missing actor user id.")
			}));
		}
		IReadOnlyList<UserCompanyAccessDto>? data;
		IReadOnlyList<string> errors;
		(data, errors) = await companyAccessAdmin.SetForUserAsync(id, request, actor.Value, cancellationToken);
		if (data == null)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, errors.Select((string e) => new ApiError("COMPANIES", e)).ToList()));
		}
		return Ok(ApiResponse<IReadOnlyList<UserCompanyAccessDto>>.Ok(data, TraceId));
	}

	[HttpGet("{id:guid}/companies")]
	[Authorize(Policy = "Permission:auth.users.read")]
	public async Task<IActionResult> GetCompanies(Guid id, CancellationToken cancellationToken)
	{
		IReadOnlyList<UserCompanyAccessDto>? data;
		IReadOnlyList<string> errors;
		(data, errors) = await companyAccessAdmin.GetForUserAsync(id, cancellationToken);
		if (data == null)
		{
			return NotFound(ApiResponse<object>.Fail(TraceId, errors.Select((string e) => new ApiError("NOT_FOUND", e)).ToList()));
		}
		return Ok(ApiResponse<IReadOnlyList<UserCompanyAccessDto>>.Ok(data, TraceId));
	}

	[HttpGet("{id:guid}/login-history")]
	[Authorize(Policy = "Permission:auth.users.read")]
	public async Task<IActionResult> LoginHistory(Guid id, CancellationToken cancellationToken)
	{
		IReadOnlyList<UserLoginHistoryDto>? items;
		IReadOnlyList<string> errors;
		(items, errors) = await userAdmin.GetLoginHistoryAsync(id, cancellationToken);
		if (items == null)
		{
			return NotFound(ApiResponse<object>.Fail(TraceId, errors.Select((string e) => new ApiError("NOT_FOUND", e)).ToList()));
		}
		return Ok(ApiResponse<IReadOnlyList<UserLoginHistoryDto>>.Ok(items, TraceId));
	}

	private Guid? GetActorUserId()
	{
		string? input = base.User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ?? base.User.FindFirst("sub")?.Value;
		Guid result;
		return Guid.TryParse(input, out result) ? new Guid?(result) : ((Guid?)null);
	}
}
