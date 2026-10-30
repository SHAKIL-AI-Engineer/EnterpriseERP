using System;
using System.Collections.Generic;

namespace AuthService.Contracts.CompanyAccess;

public sealed class SetUserCompanyAccessRequest
{
	public IReadOnlyList<UserCompanyAccessItemDto> Items { get; init; } = Array.Empty<UserCompanyAccessItemDto>();
}
