using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Options;
using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Infrastructure.Security;

public sealed class JwtTokenIssuer(IOptions<JwtOptions> options) : IJwtTokenIssuer
{
	private readonly JwtOptions _options = options.Value;

	public (string Token, DateTime ExpiresAtUtc) CreateAccessToken(
		AppUser user,
		IReadOnlyList<string> roles,
		IReadOnlyList<string> permissions,
		TenantTokenContext tenant)
	{
		if (string.IsNullOrWhiteSpace(_options.SigningKey) || _options.SigningKey.Length < 32)
		{
			throw new InvalidOperationException("Jwt:SigningKey must be configured and at least 32 characters.");
		}

		var expiresAtUtc = DateTime.UtcNow.AddMinutes((_options.AccessTokenMinutes <= 0) ? 15 : Math.Min(_options.AccessTokenMinutes, 60));
		var claims = new List<Claim>
		{
			new(ClaimTypes.NameIdentifier, user.Id.ToString()),
			new("sub", user.Id.ToString()),
			new("unique_name", user.UserName ?? string.Empty),
			new(ClaimTypes.Email, user.Email ?? string.Empty),
			new("email", user.Email ?? string.Empty),
			new("jti", Guid.NewGuid().ToString()),
            new("session_stamp", user.SecurityStamp ?? string.Empty),
			new("full_name", user.FullName),
			new(SecurityClaimTypes.TenantScope, tenant.TenantScope),
			new(SecurityClaimTypes.IsSuperAdmin, tenant.IsSuperAdmin ? "true" : "false"),
		};

		if (tenant.CompanyGuids.Count > 0)
		{
			claims.Add(new Claim(
				SecurityClaimTypes.CompanyIds,
				JsonSerializer.Serialize(tenant.CompanyGuids)));
		}

		if (tenant.DefaultCompanyGuid.HasValue)
		{
			claims.Add(new Claim(SecurityClaimTypes.DefaultCompanyId, tenant.DefaultCompanyGuid.Value.ToString()));
		}

		foreach (var role in roles)
		{
			claims.Add(new Claim(ClaimTypes.Role, role));
			claims.Add(new Claim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", role));
		}

		foreach (var permission in permissions)
		{
			claims.Add(new Claim(SecurityClaimTypes.Permission, permission));
		}

		var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
		var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
		var token = new JwtSecurityToken(
			_options.Issuer,
			_options.Audience,
			claims,
			DateTime.UtcNow.AddSeconds(-30),
			expiresAtUtc,
			creds);

		return (new JwtSecurityTokenHandler().WriteToken(token), expiresAtUtc);
	}

	public static string HashRefreshToken(string rawToken)
	{
		var inArray = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
		return Convert.ToHexString(inArray);
	}

	public static string CreateRawRefreshToken()
	{
		var array = new byte[64];
		RandomNumberGenerator.Fill(array);
		return Convert.ToBase64String(array);
	}
}
