using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Models;
using AuthService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using AuthService.Contracts.Auth;
using AuthService.Contracts.CompanyAccess;
using AuthService.Contracts.Common;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(
	IAuthService authService,
	ICompanyAccessAdminService companyAccessAdmin,
	IValidator<LoginRequest> loginValidator,
	IValidator<RegisterRequest> registerValidator,
	IValidator<RefreshTokenRequest> refreshValidator,
	IValidator<VerifyTwoFactorRequest> verifyTwoFactorValidator,
	IValidator<DisableTwoFactorRequest> disableTwoFactorValidator,
	ILogger<AuthController> logger) : ControllerBase
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

	private static AuthRequestContext BuildAuthContext(HttpContext http)
	{
		string? ip = http.Connection.RemoteIpAddress?.ToString();
		string? mac = http.Request.Headers["X-Client-Mac"].FirstOrDefault();
		string? fp = http.Request.Headers["X-Device-Fingerprint"].FirstOrDefault();
		string? ua = http.Request.Headers.UserAgent.ToString();
		if (string.IsNullOrEmpty(ua))
		{
			ua = null;
		}
		return new AuthRequestContext(ip, mac, fp, ua);
	}

	[HttpPost("login")]
	[AllowAnonymous]
	[ProducesResponseType(typeof(ApiResponse<LoginResponse>), 200)]
	public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await loginValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ToErrorResponse(validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		AuthRequestContext ctx = BuildAuthContext(base.HttpContext);
		LoginResponse? response;
		IReadOnlyList<string> errors;
		(response, errors) = await authService.LoginAsync(request, ctx, cancellationToken);
		if (response == null)
		{
			return Unauthorized(ToErrorResponse(errors.Select((string e) => new ApiError("AUTH_INVALID", e)).ToList()));
		}
		return Ok(ToSuccess(response));
	}

	[HttpPost("register")]
	[AllowAnonymous]
	[ProducesResponseType(typeof(ApiResponse<LoginResponse>), 200)]
	public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await registerValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ToErrorResponse(validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		AuthRequestContext ctx = BuildAuthContext(base.HttpContext);
		LoginResponse? response;
		IReadOnlyList<string> errors;
		(response, errors) = await authService.RegisterAsync(request, ctx, cancellationToken);
		if (response == null)
		{
			return BadRequest(ToErrorResponse(errors.Select((string e) => new ApiError("REGISTER_INVALID", e)).ToList()));
		}
		return Ok(ToSuccess(response));
	}

	[HttpPost("refresh")]
	[HttpPost("refresh-token")]
	[AllowAnonymous]
	[ProducesResponseType(typeof(ApiResponse<LoginResponse>), 200)]
	public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await refreshValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ToErrorResponse(validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		AuthRequestContext ctx = BuildAuthContext(base.HttpContext);
		LoginResponse? response;
		IReadOnlyList<string> errors;
		(response, errors) = await authService.RefreshAsync(request, ctx, cancellationToken);
		if (response == null)
		{
			return Unauthorized(ToErrorResponse(errors.Select((string e) => new ApiError("REFRESH_INVALID", e)).ToList()));
		}
		return Ok(ToSuccess(response));
	}

	[Authorize]
	[HttpPost("logout")]
	public Task<IActionResult> Logout(CancellationToken cancellationToken)
	{
		return Revoke(cancellationToken);
	}

	[Authorize]
	[HttpPost("revoke")]
	[ProducesResponseType(typeof(ApiResponse<object>), 200)]
	public async Task<IActionResult> Revoke(CancellationToken cancellationToken)
	{
		Guid? userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToErrorResponse(new ApiError[1]
			{
				new ApiError("AUTH_INVALID", "Missing user id claim.")
			}));
		}
		await authService.RevokeAllRefreshTokensAsync(userId.Value, cancellationToken);
		logger.LogInformation("Revoked refresh tokens for user {UserId}", userId);
		return Ok(ToSuccess(new
		{
			revoked = true
		}));
	}

	[Authorize]
	[HttpGet("me")]
	[ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), 200)]
	public async Task<IActionResult> Me(CancellationToken cancellationToken)
	{
		Guid? userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToErrorResponse(new ApiError[1]
			{
				new ApiError("AUTH_INVALID", "Missing user id claim.")
			}));
		}
		UserProfileResponse? profile;
		IReadOnlyList<string> errors;
		(profile, errors) = await authService.GetProfileAsync(userId.Value, cancellationToken);
		if (profile == null)
		{
			return NotFound(ToErrorResponse(errors.Select((string e) => new ApiError("PROFILE_NOT_FOUND", e)).ToList()));
		}
		return Ok(ToSuccess(profile));
	}

	[Authorize]
	[HttpGet("me/companies")]
	[ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UserCompanyAccessDto>>), 200)]
	public async Task<IActionResult> MyCompanies(CancellationToken cancellationToken)
	{
		Guid? userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToErrorResponse(new ApiError[1]
			{
				new ApiError("AUTH_INVALID", "Missing user id claim.")
			}));
		}
		IReadOnlyList<UserCompanyAccessDto>? data;
		IReadOnlyList<string> errors;
		(data, errors) = await companyAccessAdmin.GetForUserAsync(userId.Value, cancellationToken);
		if (data == null)
		{
			return NotFound(ToErrorResponse(errors.Select((string e) => new ApiError("PROFILE_NOT_FOUND", e)).ToList()));
		}
		return Ok(ToSuccess(data));
	}

	[Authorize]
	[HttpGet("access-matrix")]
	[ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AccessMatrixItemDto>>), 200)]
	public async Task<IActionResult> AccessMatrix(
		[FromServices] AuthDbContext db,
		CancellationToken cancellationToken)
	{
		var items = await db.RoutePermissions.AsNoTracking()
			.Where(r => !r.IsDeleted)
			.OrderBy(r => r.Module)
			.ThenBy(r => r.RoutePattern)
			.Select(r => new AccessMatrixItemDto
			{
				Module = r.Module,
				RoutePattern = r.RoutePattern,
				HttpMethod = r.HttpMethod,
				PermissionCode = r.PermissionCode,
				IsMenuRoute = r.IsMenuRoute,
			})
			.ToListAsync(cancellationToken);

		return Ok(ToSuccess(items));
	}

	[Authorize]
	[HttpPost("enable-2fa")]
	[ProducesResponseType(typeof(ApiResponse<EnableTwoFactorStartResponse>), 200)]
	public async Task<IActionResult> EnableTwoFactor(CancellationToken cancellationToken)
	{
		Guid? userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToErrorResponse(new ApiError[1]
			{
				new ApiError("AUTH_INVALID", "Missing user id claim.")
			}));
		}
		EnableTwoFactorStartResponse? start;
		IReadOnlyList<string> errors;
		(start, errors) = await authService.BeginEnableTwoFactorAsync(userId.Value, cancellationToken);
		if (start == null)
		{
			return BadRequest(ToErrorResponse(errors.Select((string e) => new ApiError("TWO_FACTOR", e)).ToList()));
		}
		return Ok(ToSuccess(start));
	}

	[AllowAnonymous]
	[HttpPost("verify-2fa")]
	[ProducesResponseType(typeof(ApiResponse<LoginResponse>), 200)]
	[ProducesResponseType(typeof(ApiResponse<IReadOnlyList<string>>), 200)]
	public async Task<IActionResult> VerifyTwoFactor([FromBody] VerifyTwoFactorRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await verifyTwoFactorValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ToErrorResponse(validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		if (!string.IsNullOrWhiteSpace(request.PendingTwoFactorToken))
		{
			AuthRequestContext ctx = BuildAuthContext(base.HttpContext);
			CompleteTwoFactorLoginRequest complete = new CompleteTwoFactorLoginRequest
			{
				PendingTwoFactorToken = request.PendingTwoFactorToken.Trim(),
				Code = request.Code.Trim()
			};
			LoginResponse? response;
			IReadOnlyList<string> errors;
			(response, errors) = await authService.CompleteTwoFactorLoginAsync(complete, ctx, cancellationToken);
			if (response == null)
			{
				return Unauthorized(ToErrorResponse(errors.Select((string e) => new ApiError("TWO_FACTOR", e)).ToList()));
			}
			return Ok(ToSuccess(response));
		}
		if (!(base.User.Identity?.IsAuthenticated ?? false))
		{
			return Unauthorized(ToErrorResponse(new ApiError[1]
			{
				new ApiError("AUTH_INVALID", "Authentication required to verify two-factor setup.")
			}));
		}
		Guid? userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToErrorResponse(new ApiError[1]
			{
				new ApiError("AUTH_INVALID", "Missing user id claim.")
			}));
		}
		IReadOnlyList<string>? recovery;
		IReadOnlyList<string> setupErrors;
		(recovery, setupErrors) = await authService.VerifyAndEnableTwoFactorAsync(userId.Value, request.Code.Trim(), cancellationToken);
		if (recovery == null)
		{
			return BadRequest(ToErrorResponse(setupErrors.Select((string e) => new ApiError("TWO_FACTOR", e)).ToList()));
		}
		return Ok(ToSuccess(new
		{
			recoveryCodes = recovery
		}));
	}

	[Authorize]
	[HttpPost("disable-2fa")]
	public async Task<IActionResult> DisableTwoFactor([FromBody] DisableTwoFactorRequest request, CancellationToken cancellationToken)
	{
		ValidationResult validation = await disableTwoFactorValidator.ValidateAsync(request, cancellationToken);
		if (!validation.IsValid)
		{
			return BadRequest(ToErrorResponse(validation.Errors.Select((ValidationFailure e) => new ApiError(e.PropertyName, e.ErrorMessage)).ToList()));
		}
		Guid? userId = GetUserIdOrDefault();
		if (!userId.HasValue)
		{
			return Unauthorized(ToErrorResponse(new ApiError[1]
			{
				new ApiError("AUTH_INVALID", "Missing user id claim.")
			}));
		}
		(bool ok, IReadOnlyList<string> errors) = await authService.DisableTwoFactorAsync(userId.Value, request.Password, request.Code.Trim(), cancellationToken);
		if (!ok)
		{
			return BadRequest(ToErrorResponse(errors.Select((string e) => new ApiError("TWO_FACTOR", e)).ToList()));
		}
		return Ok(ToSuccess(new
		{
			disabled = true
		}));
	}

	private Guid? GetUserIdOrDefault()
	{
		string? input = base.User.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier") ?? base.User.FindFirstValue("sub");
		Guid result;
		return Guid.TryParse(input, out result) ? new Guid?(result) : ((Guid?)null);
	}

	private ApiResponse<T> ToSuccess<T>(T data)
	{
		return ApiResponse<T>.Ok(data, TraceId);
	}

	private ApiResponse<object> ToErrorResponse(IReadOnlyList<ApiError> errors)
	{
		return ApiResponse<object>.Fail(TraceId, errors);
	}
}
