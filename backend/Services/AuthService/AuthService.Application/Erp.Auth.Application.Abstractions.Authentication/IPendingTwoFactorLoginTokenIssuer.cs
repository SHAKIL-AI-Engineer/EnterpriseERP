using System;

namespace AuthService.Application.Abstractions.Authentication;

public interface IPendingTwoFactorLoginTokenIssuer
{
	string Create(Guid userId);

	bool TryValidate(string token, out Guid userId);
}
