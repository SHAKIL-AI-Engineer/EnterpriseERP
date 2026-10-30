using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Permissions;
using AuthService.Contracts.Common;
using AuthService.Contracts.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/permissions")]
[Authorize]
public sealed class PermissionsController(IPermissionQueryService permissionQuery) : ControllerBase
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
		IReadOnlyList<PermissionDto> items = await permissionQuery.ListAsync(cancellationToken);
		return Ok(ApiResponse<IReadOnlyList<PermissionDto>>.Ok(items, TraceId));
	}
}
