using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OtpNet;

using Erp.BuildingBlocks.SharedKernel;

namespace AuthService.Infrastructure.Services;

public sealed class TwoFactorAuthenticatorService(AuthDbContext db, UserManager<AuthService.Infrastructure.Identity.AppUser> userManager, IDataProtectionProvider dataProtection) : ITwoFactorAuthenticatorService
{
	private const string ProtectorPurpose = "AuthTOTP";

	public async Task<bool> IsTwoFactorEnabledAsync(Guid userId, CancellationToken cancellationToken = default)
	{
		return await db.User2FAs.AsNoTracking().AnyAsync((User2FA x) => x.UserId == userId && x.IsEnabled, cancellationToken);
	}

	public async Task<bool> TrustedDeviceSkipsTwoFactorAsync(Guid userId, string? deviceFingerprint, CancellationToken cancellationToken = default)
	{
		if (string.IsNullOrWhiteSpace(deviceFingerprint))
		{
			return false;
		}
		return await db.UserDevices.AsNoTracking().AnyAsync((UserDevice x) => x.UserId == userId && x.DeviceFingerprint == deviceFingerprint && x.IsTrusted, cancellationToken);
	}

	public async Task<(string SharedKey, string OtpAuthUri)?> StartEnrollmentAsync(Guid userId, string userName, string issuer, CancellationToken cancellationToken = default)
	{
		AuthService.Infrastructure.Identity.AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user == null || user.IsDeleted)
		{
			return null;
		}
		User2FA? row = await db.User2FAs.FirstOrDefaultAsync((User2FA x) => x.UserId == userId, cancellationToken);
		if (row?.IsEnabled == true)
		{
			return null;
		}
		byte[] secretBytes = new byte[20];
		RandomNumberGenerator.Fill(secretBytes);
		string base32 = Base32Encoding.ToString(secretBytes);
		IDataProtector protector = dataProtection.CreateProtector("AuthTOTP");
		string protectedPayload = Convert.ToBase64String(protector.Protect(Encoding.UTF8.GetBytes(base32)));
		if (row == null)
		{
			row = new User2FA
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				Method = "Authenticator",
				IsEnabled = false,
				SecretKey = protectedPayload
			};
			db.User2FAs.Add(row);
		}
		else
		{
			row.SecretKey = protectedPayload;
			row.IsEnabled = false;
			row.RecoveryCodesHash = null;
			row.EnabledAt = null;
		}
		await db.SaveChangesAsync(cancellationToken);
		string safeIssuer = Uri.EscapeDataString(issuer);
		string safeUser = Uri.EscapeDataString(userName);
		string uri = "otpauth://totp/" + safeIssuer + ":" + safeUser + "?secret=" + base32 + "&issuer=" + safeIssuer;
		return (base32, uri);
	}

	public async Task<(IReadOnlyList<string>? RecoveryCodes, IReadOnlyList<string> Errors)> CompleteEnrollmentAsync(Guid userId, string code, CancellationToken cancellationToken = default)
	{
		User2FA? row = await db.User2FAs.FirstOrDefaultAsync((User2FA x) => x.UserId == userId, cancellationToken);
		if (row == null || row.IsEnabled)
		{
			return (RecoveryCodes: null, Errors: new string[1] { "Two-factor enrollment is not pending." });
		}
		byte[] secretBytes = UnprotectSecret(row.SecretKey);
		if (secretBytes.Length == 0)
		{
			return (RecoveryCodes: null, Errors: new string[1] { "Invalid enrollment state." });
		}
		Totp totp = new Totp(secretBytes);
		if (!totp.VerifyTotp(code.Trim().Replace(" ", string.Empty), out long _, new VerificationWindow(previous: 1, future: 1)))
		{
			return (RecoveryCodes: null, Errors: new string[1] { "Invalid authenticator code." });
		}
		List<string> recovery = GenerateRecoveryCodes(10);
		List<string> hashed = recovery.Select(HashRecoveryCode).ToList();
		row.RecoveryCodesHash = JsonSerializer.Serialize(hashed);
		row.IsEnabled = true;
		row.EnabledAt = BusinessTime.NowOffset;
		AuthService.Infrastructure.Identity.AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user != null)
		{
			user.TwoFactorEnabled = true;
			IdentityResult update = await userManager.UpdateAsync(user);
			if (!update.Succeeded)
			{
				return (RecoveryCodes: null, Errors: update.Errors.Select((IdentityError e) => e.Description).ToList());
			}
		}
		await db.SaveChangesAsync(cancellationToken);
		return (recovery, Array.Empty<string>());
	}

	public async Task<(bool Ok, IReadOnlyList<string> Errors)> DisableAsync(Guid userId, string totpOrRecoveryCode, CancellationToken cancellationToken = default)
	{
		User2FA? row = await db.User2FAs.FirstOrDefaultAsync((User2FA x) => x.UserId == userId, cancellationToken);
		if (row == null || !row.IsEnabled)
		{
			return (Ok: false, Errors: new string[1] { "Two-factor authentication is not enabled." });
		}
		(bool valid, bool _) = ValidateCodeInternal(row, totpOrRecoveryCode, consumeRecovery: true);
		if (!valid)
		{
			return (Ok: false, Errors: new string[1] { "Invalid authenticator or recovery code." });
		}
		row.IsEnabled = false;
		row.SecretKey = string.Empty;
		row.RecoveryCodesHash = null;
		row.EnabledAt = null;
		AuthService.Infrastructure.Identity.AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user != null)
		{
			user.TwoFactorEnabled = false;
			await userManager.UpdateAsync(user);
		}
		await db.SaveChangesAsync(cancellationToken);
		return (Ok: true, Errors: Array.Empty<string>());
	}

	public async Task<(bool Ok, IReadOnlyList<string> Errors)> ValidateLoginCodeAsync(Guid userId, string code, CancellationToken cancellationToken = default)
	{
		User2FA? row = await db.User2FAs.FirstOrDefaultAsync((User2FA x) => x.UserId == userId, cancellationToken);
		if (row == null || !row.IsEnabled)
		{
			return (Ok: false, Errors: new string[1] { "Two-factor authentication is not enabled." });
		}
		(bool valid, bool _) = ValidateCodeInternal(row, code, consumeRecovery: true);
		if (!valid)
		{
			return (Ok: false, Errors: new string[1] { "Invalid authenticator or recovery code." });
		}
		await db.SaveChangesAsync(cancellationToken);
		return (Ok: true, Errors: Array.Empty<string>());
	}

	private (bool Valid, bool UsedRecovery) ValidateCodeInternal(User2FA row, string code, bool consumeRecovery)
	{
		string trimmed = code.Trim().Replace(" ", string.Empty);
		if (string.IsNullOrEmpty(trimmed))
		{
			return (false, false);
		}
		byte[] secretBytes = UnprotectSecret(row.SecretKey);
		if (secretBytes.Length > 0)
		{
			Totp totp = new Totp(secretBytes);
			if (totp.VerifyTotp(trimmed, out long _, new VerificationWindow(previous: 1, future: 1)))
			{
				return (true, false);
			}
		}
		if (string.IsNullOrEmpty(row.RecoveryCodesHash))
		{
			return (false, false);
		}
		List<string>? hashes = JsonSerializer.Deserialize<List<string>>(row.RecoveryCodesHash);
		if (hashes == null || hashes.Count == 0)
		{
			return (false, false);
		}
		string candidateHash = HashRecoveryCode(trimmed);
		int index = hashes.FindIndex((string h) => string.Equals(h, candidateHash, StringComparison.Ordinal));
		if (index < 0)
		{
			return (false, false);
		}
		if (consumeRecovery)
		{
			hashes.RemoveAt(index);
			row.RecoveryCodesHash = hashes.Count > 0 ? JsonSerializer.Serialize(hashes) : null;
		}
		return (true, true);
	}

	private byte[] UnprotectSecret(string stored)
	{
		try
		{
			IDataProtector protector = dataProtection.CreateProtector("AuthTOTP");
			return protector.Unprotect(Convert.FromBase64String(stored));
		}
		catch
		{
			return Array.Empty<byte>();
		}
	}

	private static List<string> GenerateRecoveryCodes(int count)
	{
		List<string> list = new List<string>();
		for (int i = 0; i < count; i++)
		{
			byte[] buf = new byte[5];
			RandomNumberGenerator.Fill(buf);
			list.Add(Convert.ToHexString(buf));
		}
		return list;
	}

	private static string HashRecoveryCode(string code)
	{
		byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes("erp-recovery:" + code.Trim().ToUpperInvariant()));
		return Convert.ToHexString(bytes);
	}
}
