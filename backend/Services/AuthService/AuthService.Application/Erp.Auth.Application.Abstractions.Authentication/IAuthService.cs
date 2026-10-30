using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Models;
using AuthService.Contracts.Auth;

namespace AuthService.Application.Abstractions.Authentication;

public interface IAuthService
{
	Task<(LoginResponse? Response, IReadOnlyList<string> Errors)> LoginAsync(LoginRequest request, AuthRequestContext? context, CancellationToken cancellationToken = default);

	Task<(LoginResponse? Response, IReadOnlyList<string> Errors)> CompleteTwoFactorLoginAsync(CompleteTwoFactorLoginRequest request, AuthRequestContext? context, CancellationToken cancellationToken = default);

	Task<(LoginResponse? Response, IReadOnlyList<string> Errors)> RegisterAsync(RegisterRequest request, AuthRequestContext? context, CancellationToken cancellationToken = default);

	Task<(LoginResponse? Response, IReadOnlyList<string> Errors)> RefreshAsync(RefreshTokenRequest request, AuthRequestContext? context, CancellationToken cancellationToken = default);

	Task<bool> RevokeAllRefreshTokensAsync(Guid userId, CancellationToken cancellationToken = default);

	Task<(UserProfileResponse? Response, IReadOnlyList<string> Errors)> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);

	Task<(EnableTwoFactorStartResponse? Response, IReadOnlyList<string> Errors)> BeginEnableTwoFactorAsync(Guid userId, CancellationToken cancellationToken = default);

	Task<(IReadOnlyList<string>? RecoveryCodes, IReadOnlyList<string> Errors)> VerifyAndEnableTwoFactorAsync(Guid userId, string code, CancellationToken cancellationToken = default);

	Task<(bool Ok, IReadOnlyList<string> Errors)> DisableTwoFactorAsync(Guid userId, string password, string code, CancellationToken cancellationToken = default);

	Task<(UserProfileResponse? Response, IReadOnlyList<string> Errors)> UpdateProfileAsync(
		Guid userId,
		UpdateUserProfileRequest request,
		CancellationToken cancellationToken = default);

	Task<(bool Ok, IReadOnlyList<string> Errors)> ChangePasswordAsync(
		Guid userId,
		ChangePasswordRequest request,
		CancellationToken cancellationToken = default);

	Task<(UserProfileResponse? Response, IReadOnlyList<string> Errors)> UpdateProfilePictureAsync(
		Guid userId,
		Stream fileStream,
		string contentType,
		CancellationToken cancellationToken = default);

	Task<(UserProfileResponse? Response, IReadOnlyList<string> Errors)> RemoveProfilePictureAsync(
		Guid userId,
		CancellationToken cancellationToken = default);
}
