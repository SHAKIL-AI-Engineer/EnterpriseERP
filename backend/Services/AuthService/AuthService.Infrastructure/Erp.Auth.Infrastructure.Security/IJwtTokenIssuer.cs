using System;
using System.Collections.Generic;
using AuthService.Infrastructure.Identity;

namespace AuthService.Infrastructure.Security;

public interface IJwtTokenIssuer
{
	(string Token, DateTime ExpiresAtUtc) CreateAccessToken(
		AppUser user,
		IReadOnlyList<string> roles,
		IReadOnlyList<string> permissions,
		TenantTokenContext tenant);
}
