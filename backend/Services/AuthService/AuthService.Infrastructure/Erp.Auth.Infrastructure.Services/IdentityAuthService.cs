using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Application.Security;
using AuthService.Application.Abstractions.CompanyAccess;
using AuthService.Application.Models;
using AuthService.Contracts.Auth;
using AuthService.Contracts.CompanyAccess;
using AuthService.Contracts.Common;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Options;
using AuthService.Infrastructure.Persistence;
using AuthService.Infrastructure.Security;
using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Erp.BuildingBlocks.SharedKernel;

namespace AuthService.Infrastructure.Services;

public sealed class IdentityAuthService(
	AuthDbContext db,
	IUserCompanyAccessRepository companyAccessRepository,
	UserManager<AppUser> userManager,
	IJwtTokenIssuer jwtTokenIssuer,
	IOptions<JwtOptions> jwtOptions,
	IOptions<AuthFeatureOptions> featureOptions,
	IOptions<TwoFactorOptions> twoFactorOptions,
	IHostEnvironment environment,
	ILogger<IdentityAuthService> logger,
	IPendingTwoFactorLoginTokenIssuer pendingTwoFactor,
	ITwoFactorAuthenticatorService twoFactor,
	IUserProfilePictureStorage profilePictures) : IAuthService
{
	private readonly JwtOptions _jwt = jwtOptions.Value;

	private readonly AuthFeatureOptions _features = featureOptions.Value;

	private readonly TwoFactorOptions _twoFactorOpts = twoFactorOptions.Value;

	public async Task<(LoginResponse? Response, IReadOnlyList<string> Errors)> LoginAsync(LoginRequest request, AuthRequestContext? context, CancellationToken cancellationToken = default(CancellationToken))
	{
		string username = request.Username.Trim();
		AppUser? user = await userManager.FindByNameAsync(username);
		if (user == null || user.IsDeleted)
		{
			return (Response: null, Errors: new string[1] { "Invalid username or password." });
		}
		if (await userManager.IsLockedOutAsync(user))
		{
			await AppendLoginHistoryAsync(user.Id, context, isSuccess: false, "Account locked.", cancellationToken);
			await db.SaveChangesAsync(cancellationToken);
			return (Response: null, Errors: new string[1] { "Account is locked. Try again later." });
		}
		if (!user.IsActive)
		{
			await AppendLoginHistoryAsync(user.Id, context, isSuccess: false, "User is inactive.", cancellationToken);
			await db.SaveChangesAsync(cancellationToken);
			return (Response: null, Errors: new string[1] { "Account is not allowed to sign in." });
		}
		if (user.Status != UserStatus.Active)
		{
			await AppendLoginHistoryAsync(user.Id, context, isSuccess: false, "User status is not active.", cancellationToken);
			await db.SaveChangesAsync(cancellationToken);
			return (Response: null, Errors: new string[1] { "Account is not allowed to sign in." });
		}
		if (!(await userManager.CheckPasswordAsync(user, request.Password)))
		{
			await userManager.AccessFailedAsync(user);
			await AppendLoginHistoryAsync(user.Id, context, isSuccess: false, "Invalid password.", cancellationToken);
			await db.SaveChangesAsync(cancellationToken);
			return (Response: null, Errors: new string[1] { "Invalid username or password." });
		}
		await userManager.ResetAccessFailedCountAsync(user);
		if (await twoFactor.IsTwoFactorEnabledAsync(user.Id, cancellationToken))
		{
			bool trusted = await twoFactor.TrustedDeviceSkipsTwoFactorAsync(user.Id, context?.DeviceFingerprint, cancellationToken);
			if (!trusted)
			{
				if (!string.IsNullOrWhiteSpace(request.TwoFactorCode))
				{
					(bool ok2, IReadOnlyList<string> err2) = await twoFactor.ValidateLoginCodeAsync(user.Id, request.TwoFactorCode.Trim(), cancellationToken);
					if (!ok2)
					{
						await AppendLoginHistoryAsync(user.Id, context, isSuccess: false, "Invalid two-factor code.", cancellationToken);
						await db.SaveChangesAsync(cancellationToken);
						return (Response: null, Errors: err2);
					}
				}
				else
				{
					string pending = pendingTwoFactor.Create(user.Id);
					await AppendLoginHistoryAsync(user.Id, context, isSuccess: false, "Two-factor code required.", cancellationToken);
					await db.SaveChangesAsync(cancellationToken);
					return (Response: new LoginResponse
					{
						AccessToken = string.Empty,
						RefreshToken = string.Empty,
						ExpiresInSeconds = 0,
						UserId = user.Id,
						Username = (user.UserName ?? string.Empty),
						FullName = user.FullName,
						Email = (user.Email ?? string.Empty),
						Roles = Array.Empty<string>(),
						Permissions = Array.Empty<string>(),
						RequiresTwoFactor = true,
						PendingTwoFactorToken = pending
					}, Errors: Array.Empty<string>());
				}
			}
		}
		return await FinalizeSuccessfulLoginAsync(user, context, cancellationToken);
	}

	public async Task<(LoginResponse? Response, IReadOnlyList<string> Errors)> CompleteTwoFactorLoginAsync(CompleteTwoFactorLoginRequest request, AuthRequestContext? context, CancellationToken cancellationToken = default(CancellationToken))
	{
		if (!pendingTwoFactor.TryValidate(request.PendingTwoFactorToken.Trim(), out Guid userId))
		{
			return (Response: null, Errors: new string[1] { "Invalid or expired two-factor login token." });
		}
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user == null || user.IsDeleted || !user.IsActive || user.Status != UserStatus.Active)
		{
			return (Response: null, Errors: new string[1] { "User not found or not allowed to sign in." });
		}
		(bool ok, IReadOnlyList<string> errors) = await twoFactor.ValidateLoginCodeAsync(user.Id, request.Code.Trim(), cancellationToken);
		if (!ok)
		{
			await AppendLoginHistoryAsync(user.Id, context, isSuccess: false, "Invalid two-factor code (complete login).", cancellationToken);
			await db.SaveChangesAsync(cancellationToken);
			return (Response: null, Errors: errors);
		}
		return await FinalizeSuccessfulLoginAsync(user, context, cancellationToken);
	}

	public async Task<(LoginResponse? Response, IReadOnlyList<string> Errors)> RegisterAsync(RegisterRequest request, AuthRequestContext? context, CancellationToken cancellationToken = default(CancellationToken))
	{
		if (!_features.AllowSelfRegistration && !environment.IsDevelopment())
		{
			return (Response: null, Errors: new string[1] { "Self registration is disabled." });
		}
		AppUser user = new AppUser
		{
			Id = Guid.NewGuid(),
			UserName = request.Username.Trim(),
			Email = request.Email.Trim(),
			FullName = request.FullName.Trim(),
			EmailConfirmed = true,
			IsActive = true,
			Status = UserStatus.Active,
			LockoutEnabled = true,
			CreatedAt = BusinessTime.NowOffset
		};
		IdentityResult result = await userManager.CreateAsync(user, request.Password);
		if (!result.Succeeded)
		{
			return (Response: null, Errors: result.Errors.Select((IdentityError e) => e.Description).ToList());
		}
		if (await db.Roles.AnyAsync((AppRole r) => r.Name == "User" && !r.IsDeleted, cancellationToken))
		{
			await userManager.AddToRoleAsync(user, "User");
		}
		List<string> roles = (await userManager.GetRolesAsync(user)).OrderBy((string x) => x).ToList();
		IReadOnlyList<string> permissions = await LoadPermissionsForRolesAsync(roles, cancellationToken);
		logger.LogInformation("Registered user {UserId} {Username}", user.Id, user.UserName);
		LoginResponse? regResponse;
		IReadOnlyList<string> regErrors;
		var companyRecords = await companyAccessRepository.ListActiveByUserIdAsync(user.Id, cancellationToken);
		(regResponse, _, regErrors) = await IssueTokensAsync(user, roles, permissions, companyRecords, context, cancellationToken);
		await db.SaveChangesAsync(cancellationToken);
		return (Response: regResponse, Errors: regErrors);
	}

	public async Task<(LoginResponse? Response, IReadOnlyList<string> Errors)> RefreshAsync(RefreshTokenRequest request, AuthRequestContext? context, CancellationToken cancellationToken = default(CancellationToken))
	{
		string hash = JwtTokenIssuer.HashRefreshToken(request.RefreshToken.Trim());
		(LoginResponse?, IReadOnlyList<string>) result;
		var strategy = db.Database.CreateExecutionStrategy();
		result = await strategy.ExecuteAsync(async () =>
		{
			await using IDbContextTransaction transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
			RefreshToken? existing = await db.RefreshTokens.Include((RefreshToken x) => x.User).FirstOrDefaultAsync((RefreshToken x) => x.TokenHash == hash, cancellationToken);
			if (existing == null || existing.RevokedAt.HasValue || existing.IsRevoked)
			{
				return ((LoginResponse?)null, new string[1] { "Invalid refresh token." });
			}
			if (existing.ExpiresAt < DateTimeOffset.UtcNow)
			{
				return ((LoginResponse?)null, new string[1] { "Refresh token expired." });
			}
			AppUser user = existing.User;
			if (!user.IsActive || user.IsDeleted || user.Status != UserStatus.Active)
			{
				return ((LoginResponse?)null, new string[1] { "User is inactive." });
			}
			existing.RevokedAt = BusinessTime.NowOffset;
			existing.IsRevoked = true;
			existing.RevokedReason = "rotated";
			List<string> roles = (await userManager.GetRolesAsync(user)).OrderBy((string x) => x).ToList();
			var companyRecords = await companyAccessRepository.ListActiveByUserIdAsync(user.Id, cancellationToken);
			var (allowed, companyError) = TenantLoginValidator.ValidateCompanyAccessForLogin(roles, companyRecords);
			if (!allowed)
			{
				return ((LoginResponse?)null, new[] { companyError! });
			}
			LoginResponse? response;
			Guid? newRefreshId;
			IReadOnlyList<string> errors;
			string? carryIp = context?.IpAddress ?? existing.IpAddress;
			AuthRequestContext merged = new AuthRequestContext(carryIp, context?.MacAddress ?? existing.MacAddress, context?.DeviceFingerprint ?? existing.DeviceFingerprint, context?.UserAgent);
			(response, newRefreshId, errors) = await IssueTokensAsync(user, roles, await LoadPermissionsForRolesAsync(roles, cancellationToken), companyRecords, merged, cancellationToken, existing.FamilyId);
			if (response == null || !newRefreshId.HasValue)
			{
				return ((LoginResponse?)null, errors);
			}
			existing.ReplacedByTokenId = newRefreshId;
			await db.SaveChangesAsync(cancellationToken);
			await transaction.CommitAsync(cancellationToken);
			return (response, Array.Empty<string>());
		});
		return result;
	}

	public async Task<bool> RevokeAllRefreshTokensAsync(Guid userId, CancellationToken cancellationToken = default(CancellationToken))
	{
		List<RefreshToken> tokens = await db.RefreshTokens.Where((RefreshToken x) => x.UserId == userId && x.RevokedAt == null && !x.IsRevoked).ToListAsync(cancellationToken);
		DateTimeOffset now = BusinessTime.NowOffset;
		foreach (RefreshToken token in tokens)
		{
			token.RevokedAt = now;
			token.IsRevoked = true;
			token.RevokedReason = "revoked";
		}
		await db.SaveChangesAsync(cancellationToken);
		return true;
	}

	public async Task<(UserProfileResponse? Response, IReadOnlyList<string> Errors)> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default(CancellationToken))
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user?.IsDeleted ?? true)
		{
			return (Response: null, Errors: new string[1] { "User not found." });
		}

		return (await BuildProfileResponseAsync(user, cancellationToken), Array.Empty<string>());
	}

	public async Task<(UserProfileResponse? Response, IReadOnlyList<string> Errors)> UpdateProfileAsync(
		Guid userId,
		UpdateUserProfileRequest request,
		CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user?.IsDeleted ?? true)
		{
			return (null, new[] { "User not found." });
		}

		var normalizedEmail = request.Email.Trim();
		var existingByEmail = await userManager.FindByEmailAsync(normalizedEmail);
		if (existingByEmail is not null && existingByEmail.Id != user.Id)
		{
			return (null, new[] { "Email is already in use." });
		}

		user.FullName = request.FullName.Trim();
		user.Country = string.IsNullOrWhiteSpace(request.Country) ? null : request.Country.Trim();
		user.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
		user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
		user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
		user.UpdatedAt = DateTimeOffset.UtcNow;
		user.UpdatedBy = userId;

		if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
		{
			var emailResult = await userManager.SetEmailAsync(user, normalizedEmail);
			if (!emailResult.Succeeded)
			{
				return (null, emailResult.Errors.Select(e => e.Description).ToArray());
			}
		}

		var updateResult = await userManager.UpdateAsync(user);
		if (!updateResult.Succeeded)
		{
			return (null, updateResult.Errors.Select(e => e.Description).ToArray());
		}

		return (await BuildProfileResponseAsync(user, cancellationToken), Array.Empty<string>());
	}

	public async Task<(bool Ok, IReadOnlyList<string> Errors)> ChangePasswordAsync(
		Guid userId,
		ChangePasswordRequest request,
		CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user?.IsDeleted ?? true)
		{
			return (false, new[] { "User not found." });
		}

		if (!await userManager.CheckPasswordAsync(user, request.CurrentPassword))
		{
			return (false, new[] { "Current password is incorrect." });
		}

		var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
		if (!result.Succeeded)
		{
			return (false, result.Errors.Select(e => e.Description).ToArray());
		}

		user.UpdatedAt = DateTimeOffset.UtcNow;
		user.UpdatedBy = userId;
		await userManager.UpdateAsync(user);
		return (true, Array.Empty<string>());
	}

	public async Task<(UserProfileResponse? Response, IReadOnlyList<string> Errors)> UpdateProfilePictureAsync(
		Guid userId,
		Stream fileStream,
		string contentType,
		CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user?.IsDeleted ?? true)
		{
			return (null, new[] { "User not found." });
		}

		try
		{
			await profilePictures.DeleteIfExistsAsync(user.ProfilePictureUrl, cancellationToken);
			var relativeUrl = await profilePictures.SaveAsync(userId, fileStream, contentType, cancellationToken);
			user.ProfilePictureUrl = relativeUrl;
			user.UpdatedAt = DateTimeOffset.UtcNow;
			user.UpdatedBy = userId;
			var updateResult = await userManager.UpdateAsync(user);
			if (!updateResult.Succeeded)
			{
				return (null, updateResult.Errors.Select(e => e.Description).ToArray());
			}

			return (await BuildProfileResponseAsync(user, cancellationToken), Array.Empty<string>());
		}
		catch (InvalidOperationException ex)
		{
			return (null, new[] { ex.Message });
		}
	}

	public async Task<(UserProfileResponse? Response, IReadOnlyList<string> Errors)> RemoveProfilePictureAsync(
		Guid userId,
		CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user?.IsDeleted ?? true)
		{
			return (null, new[] { "User not found." });
		}

		await profilePictures.DeleteIfExistsAsync(user.ProfilePictureUrl, cancellationToken);
		user.ProfilePictureUrl = null;
		user.UpdatedAt = DateTimeOffset.UtcNow;
		user.UpdatedBy = userId;
		await userManager.UpdateAsync(user);
		return (await BuildProfileResponseAsync(user, cancellationToken), Array.Empty<string>());
	}

	private async Task<UserProfileResponse> BuildProfileResponseAsync(AppUser user, CancellationToken cancellationToken)
	{
		DateTimeOffset now = DateTimeOffset.UtcNow;
		bool locked = user.LockoutEnd.HasValue && user.LockoutEnd > now;
		List<string> roles = (await userManager.GetRolesAsync(user)).OrderBy(x => x).ToList();
		IReadOnlyList<string> permissions = await LoadPermissionsForRolesAsync(roles, cancellationToken);
		var companyRecords = await companyAccessRepository.ListActiveByUserIdAsync(user.Id, cancellationToken);
		List<UserCompanyAccessDto> companyDtos = companyRecords.Select(c => new UserCompanyAccessDto
		{
			Id = c.Id,
			CompanyId = c.CompanyGuid,
			IsDefaultCompany = c.IsDefaultCompany,
		}).ToList();
		var tenant = BuildTenantTokenContext(roles, companyRecords);
		bool tf = await twoFactor.IsTwoFactorEnabledAsync(user.Id, cancellationToken);
		return new UserProfileResponse
		{
			UserId = user.Id,
			Username = user.UserName ?? string.Empty,
			Email = user.Email ?? string.Empty,
			PhoneNumber = user.PhoneNumber,
			FullName = user.FullName,
			ProfilePictureUrl = user.ProfilePictureUrl,
			Country = user.Country,
			City = user.City,
			Bio = user.Bio,
			IsActive = user.IsActive,
			Status = user.Status,
			IsLocked = locked,
			LastLoginAt = user.LastLoginAt,
			TwoFactorEnabled = tf,
			Roles = roles,
			Permissions = permissions,
			CompanyAccess = companyDtos,
			TenantScope = tenant.TenantScope,
			DefaultCompanyId = tenant.DefaultCompanyGuid,
		};
	}

	public async Task<(EnableTwoFactorStartResponse? Response, IReadOnlyList<string> Errors)> BeginEnableTwoFactorAsync(Guid userId, CancellationToken cancellationToken = default(CancellationToken))
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user == null || user.IsDeleted)
		{
			return (Response: null, Errors: new string[1] { "User not found." });
		}
		(string SharedKey, string OtpAuthUri)? start = await twoFactor.StartEnrollmentAsync(userId, user.UserName ?? user.Email ?? user.Id.ToString(), _twoFactorOpts.Issuer, cancellationToken);
		if (!start.HasValue)
		{
			return (Response: null, Errors: new string[1] { "Two-factor authentication is already enabled or could not be started." });
		}
		return (new EnableTwoFactorStartResponse
		{
			SharedKey = start.Value.SharedKey,
			OtpAuthUri = start.Value.OtpAuthUri
		}, Array.Empty<string>());
	}

	public async Task<(IReadOnlyList<string>? RecoveryCodes, IReadOnlyList<string> Errors)> VerifyAndEnableTwoFactorAsync(Guid userId, string code, CancellationToken cancellationToken = default(CancellationToken))
	{
		return await twoFactor.CompleteEnrollmentAsync(userId, code, cancellationToken);
	}

	public async Task<(bool Ok, IReadOnlyList<string> Errors)> DisableTwoFactorAsync(Guid userId, string password, string code, CancellationToken cancellationToken = default(CancellationToken))
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user == null || user.IsDeleted)
		{
			return (Ok: false, Errors: new string[1] { "User not found." });
		}
		if (!(await userManager.CheckPasswordAsync(user, password)))
		{
			return (Ok: false, Errors: new string[1] { "Invalid password." });
		}
		return await twoFactor.DisableAsync(userId, code, cancellationToken);
	}

	private async Task<(LoginResponse? Response, IReadOnlyList<string> Errors)> FinalizeSuccessfulLoginAsync(AppUser user, AuthRequestContext? context, CancellationToken cancellationToken)
	{
		user.LastLoginAt = BusinessTime.NowOffset;
		await userManager.UpdateAsync(user);
		await AppendLoginHistoryAsync(user.Id, context, isSuccess: true, null, cancellationToken);
		await UpsertDeviceAsync(user.Id, context, cancellationToken);
		List<string> roles = (await userManager.GetRolesAsync(user)).OrderBy((string x) => x).ToList();
		var companyRecords = await companyAccessRepository.ListActiveByUserIdAsync(user.Id, cancellationToken);
		var (allowed, companyError) = TenantLoginValidator.ValidateCompanyAccessForLogin(roles, companyRecords);
		if (!allowed)
		{
			await AppendLoginHistoryAsync(user.Id, context, isSuccess: false, companyError, cancellationToken);
			await db.SaveChangesAsync(cancellationToken);
			return (Response: null, Errors: new[] { companyError! });
		}

		LoginResponse? response;
		Guid? rid;
		IReadOnlyList<string> errors;
		(response, rid, errors) = await IssueTokensAsync(user, roles, await LoadPermissionsForRolesAsync(roles, cancellationToken), companyRecords, context, cancellationToken);
		await db.SaveChangesAsync(cancellationToken);
		return (response, errors);
	}

	private static TenantTokenContext BuildTenantTokenContext(
		IReadOnlyList<string> roles,
		IReadOnlyList<UserCompanyAccessRecord> companyRecords)
	{
		var isSuperAdmin = roles.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);
		var companyGuids = companyRecords.Select(c => c.CompanyGuid).Distinct().ToList();
		var defaultCompany = companyRecords.FirstOrDefault(c => c.IsDefaultCompany)?.CompanyGuid
			?? companyGuids.FirstOrDefault();

		return new TenantTokenContext
		{
			IsSuperAdmin = isSuperAdmin,
			TenantScope = isSuperAdmin ? SecurityClaimTypes.TenantScopeGlobal : SecurityClaimTypes.TenantScopeCompany,
			CompanyGuids = companyGuids,
			DefaultCompanyGuid = defaultCompany == Guid.Empty ? null : defaultCompany,
		};
	}

	private async Task AppendLoginHistoryAsync(Guid userId, AuthRequestContext? context, bool isSuccess, string? failureReason, CancellationToken cancellationToken)
	{
		(string? deviceName, string? browser, string? os) = UserAgentBrowserParser.Parse(context?.UserAgent);
		db.UserLoginHistories.Add(new UserLoginHistory
		{
			Id = Guid.NewGuid(),
			UserId = userId,
			IpAddress = context?.IpAddress,
			MacAddress = context?.MacAddress,
			DeviceName = deviceName,
			Browser = browser,
			OperatingSystem = os,
			IsSuccess = isSuccess,
			FailureReason = failureReason,
			LoginAt = BusinessTime.NowOffset
		});
		await Task.CompletedTask;
	}

	private async Task UpsertDeviceAsync(Guid userId, AuthRequestContext? context, CancellationToken cancellationToken)
	{
		if (string.IsNullOrWhiteSpace(context?.DeviceFingerprint))
		{
			return;
		}
		string fp = context.DeviceFingerprint.Trim();
		UserDevice? device = await db.UserDevices.FirstOrDefaultAsync((UserDevice x) => x.UserId == userId && x.DeviceFingerprint == fp, cancellationToken);
		(string? deviceName, string? _, string? _) = UserAgentBrowserParser.Parse(context.UserAgent);
		DateTimeOffset now = BusinessTime.NowOffset;
		if (device == null)
		{
			db.UserDevices.Add(new UserDevice
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				DeviceName = deviceName,
				IpAddress = context.IpAddress,
				MacAddress = context.MacAddress,
				DeviceFingerprint = fp,
				IsTrusted = false,
				LastUsedAt = now
			});
		}
		else
		{
			device.LastUsedAt = now;
			device.IpAddress = context.IpAddress ?? device.IpAddress;
			device.MacAddress = context.MacAddress ?? device.MacAddress;
			device.DeviceName = deviceName ?? device.DeviceName;
		}
		await Task.CompletedTask;
	}

	private async Task<IReadOnlyList<string>> LoadPermissionsForRolesAsync(IReadOnlyList<string> roleNames, CancellationToken cancellationToken)
	{
		if (roleNames.Count == 0)
		{
			return Array.Empty<string>();
		}
		List<Guid> roleIds = await (from r in db.Roles.AsNoTracking()
			where r.Name != null && roleNames.Contains<string>(r.Name) && !r.IsDeleted
			select r.Id).ToListAsync(cancellationToken);
		if (roleIds.Count == 0)
		{
			return Array.Empty<string>();
		}
		return await (from x in (from rp in db.RolePermissions.AsNoTracking()
				where roleIds.Contains(rp.RoleId) && !rp.Permission.IsDeleted
				select rp.Permission.Code).Distinct()
			orderby x
			select x).ToListAsync(cancellationToken);
	}

	private async Task<(LoginResponse? Response, Guid? NewRefreshTokenId, IReadOnlyList<string> Errors)> IssueTokensAsync(
		AppUser user,
		IReadOnlyList<string> roles,
		IReadOnlyList<string> permissions,
		IReadOnlyList<UserCompanyAccessRecord> companyRecords,
		AuthRequestContext? context,
		CancellationToken cancellationToken,
		Guid? familyId = null)
	{
		var tenant = BuildTenantTokenContext(roles, companyRecords);
		(string, DateTime) tuple = jwtTokenIssuer.CreateAccessToken(user, roles, permissions, tenant);
		string accessToken = tuple.Item1;
		DateTime expiresAtUtc = tuple.Item2;
		string rawRefresh = JwtTokenIssuer.CreateRawRefreshToken();
		string refreshHash = JwtTokenIssuer.HashRefreshToken(rawRefresh);
		Guid family = familyId ?? Guid.NewGuid();
		int refreshDays = ((_jwt.RefreshTokenDays <= 0) ? 7 : _jwt.RefreshTokenDays);
		RefreshToken refreshEntity = new RefreshToken
		{
			Id = Guid.NewGuid(),
			UserId = user.Id,
			TokenHash = refreshHash,
			FamilyId = family,
			ExpiresAt = DateTimeOffset.UtcNow.AddDays(refreshDays),
			CreatedAt = BusinessTime.NowOffset,
			IpAddress = context?.IpAddress,
			MacAddress = context?.MacAddress,
			DeviceFingerprint = context?.DeviceFingerprint
		};
		db.RefreshTokens.Add(refreshEntity);
		int expiresIn = (int)Math.Max(1.0, (expiresAtUtc - DateTime.UtcNow).TotalSeconds);
		LoginResponse response = new LoginResponse
		{
			AccessToken = accessToken,
			RefreshToken = rawRefresh,
			ExpiresInSeconds = expiresIn,
			UserId = user.Id,
			Username = (user.UserName ?? string.Empty),
			FullName = user.FullName,
			Email = (user.Email ?? string.Empty),
			Roles = roles,
			Permissions = permissions,
			RequiresTwoFactor = false,
			PendingTwoFactorToken = null
		};
		return (Response: response, NewRefreshTokenId: refreshEntity.Id, Errors: Array.Empty<string>());
	}
}
