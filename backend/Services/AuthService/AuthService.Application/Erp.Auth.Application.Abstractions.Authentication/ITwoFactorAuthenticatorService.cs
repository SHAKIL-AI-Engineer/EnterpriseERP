using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AuthService.Application.Abstractions.Authentication;

public interface ITwoFactorAuthenticatorService
{
	Task<bool> IsTwoFactorEnabledAsync(Guid userId, CancellationToken cancellationToken = default);

	Task<bool> TrustedDeviceSkipsTwoFactorAsync(Guid userId, string? deviceFingerprint, CancellationToken cancellationToken = default);

	Task<(string SharedKey, string OtpAuthUri)?> StartEnrollmentAsync(Guid userId, string userName, string issuer, CancellationToken cancellationToken = default);

	Task<(IReadOnlyList<string>? RecoveryCodes, IReadOnlyList<string> Errors)> CompleteEnrollmentAsync(Guid userId, string code, CancellationToken cancellationToken = default);

	Task<(bool Ok, IReadOnlyList<string> Errors)> DisableAsync(Guid userId, string totpOrRecoveryCode, CancellationToken cancellationToken = default);

	Task<(bool Ok, IReadOnlyList<string> Errors)> ValidateLoginCodeAsync(Guid userId, string code, CancellationToken cancellationToken = default);
}
