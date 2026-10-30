using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthService.Application.Abstractions.Authentication;
using AuthService.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Infrastructure.Security;

public sealed class PendingTwoFactorLoginTokenIssuer(IOptions<JwtOptions> jwtOptions) : IPendingTwoFactorLoginTokenIssuer
{
	private readonly JwtOptions _jwt = jwtOptions.Value;

	public string Create(Guid userId)
	{
		if (string.IsNullOrWhiteSpace(_jwt.SigningKey) || _jwt.SigningKey.Length < 32)
		{
			throw new InvalidOperationException("Jwt:SigningKey must be configured and at least 32 characters.");
		}
		Claim[] claims = new Claim[3]
		{
			new Claim("sub", userId.ToString()),
			new Claim("jti", Guid.NewGuid().ToString()),
			new Claim("amr", "pending2fa")
		};
		SymmetricSecurityKey signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SigningKey));
		SigningCredentials credentials = new SigningCredentials(signingKey, "HS256");
		DateTime utcNow = DateTime.UtcNow;
		JwtSecurityToken token = new JwtSecurityToken(_jwt.Issuer, _jwt.Audience, claims, utcNow.AddSeconds(-30.0), utcNow.AddMinutes(5.0), credentials);
		return new JwtSecurityTokenHandler().WriteToken(token);
	}

	public bool TryValidate(string token, out Guid userId)
	{
		userId = default(Guid);
		if (string.IsNullOrWhiteSpace(token))
		{
			return false;
		}
		try
		{
			JwtSecurityTokenHandler handler = new JwtSecurityTokenHandler();
			TokenValidationParameters parameters = new TokenValidationParameters
			{
				ValidateIssuer = true,
				ValidIssuer = _jwt.Issuer,
				ValidateAudience = true,
				ValidAudience = _jwt.Audience,
				ValidateIssuerSigningKey = true,
				IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SigningKey)),
				ValidateLifetime = true,
				ClockSkew = TimeSpan.FromSeconds(30.0)
			};
			ClaimsPrincipal principal = handler.ValidateToken(token.Trim(), parameters, out SecurityToken _);
			if (!string.Equals(principal.FindFirst("amr")?.Value, "pending2fa", StringComparison.Ordinal))
			{
				return false;
			}
			string? sub = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
			return Guid.TryParse(sub, out userId) && userId != Guid.Empty;
		}
		catch
		{
			return false;
		}
	}
}
