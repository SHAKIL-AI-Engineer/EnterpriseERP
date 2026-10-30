using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Roles;
using AuthService.Contracts.Common;
using AuthService.Contracts.Roles;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/roles")]
[Authorize]
public sealed class RolesController(IRoleAdminService roleAdmin, IValidator<RoleCreateRequest> createValidator, IValidator<AssignRolePermissionsRequest> assignValidator) : ControllerBase
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
	[Authorize(Policy = "Permission:auth.roles.read")]
	public async Task<IActionResult> List(CancellationToken cancellationToken)
	{
		IReadOnlyList<RoleDto>? items;
		IReadOnlyList<string> errors;
		(items, errors) = await roleAdmin.ListRolesAsync(cancellationToken);
		if (items == null)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, errors.Select((string e) => new ApiError("ROLES", e)).ToList()));
		}
		return Ok(ApiResponse<IReadOnlyList<RoleDto>>.Ok(items, TraceId));
	}

	[HttpPost]
	[Authorize(Policy = "Permission:auth.roles.write")]
	public async Task<IActionResult> Create([FromBody] RoleCreateRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await createValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		RoleDto? role;
		IReadOnlyList<string> errors;
		(role, errors) = await roleAdmin.CreateRoleAsync(request, cancellationToken);
		if (role == null)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, errors.Select((string e) => new ApiError("ROLES", e)).ToList()));
		}
		return Ok(ApiResponse<RoleDto>.Ok(role, TraceId));
	}

	[HttpPost("{roleId:guid}/permissions")]
	[Authorize(Policy = "Permission:auth.roles.write")]
	public async Task<IActionResult> AssignPermissions(Guid roleId, [FromBody] AssignRolePermissionsRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await assignValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		(bool ok, IReadOnlyList<string> errors) = await roleAdmin.AssignPermissionsAsync(roleId, request, cancellationToken);
		if (!ok)
		{
			return BadRequest(ApiResponse<object>.Fail(TraceId, errors.Select((string e) => new ApiError("ROLES", e)).ToList()));
		}
		return Ok(ApiResponse<object>.Ok(new { updated = true }, TraceId));
	}
}
