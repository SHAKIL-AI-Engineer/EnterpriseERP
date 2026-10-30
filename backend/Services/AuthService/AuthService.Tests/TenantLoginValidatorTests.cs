using AuthService.Application.Models;
using AuthService.Application.Security;
using Xunit;

namespace AuthService.Tests;

public sealed class TenantLoginValidatorTests
{
	[Fact]
	public void SuperAdmin_without_companies_is_allowed()
	{
		var (allowed, error) = TenantLoginValidator.ValidateCompanyAccessForLogin(
			["SuperAdmin"],
			Array.Empty<UserCompanyAccessRecord>());

		Assert.True(allowed);
		Assert.Null(error);
	}

	[Fact]
	public void Hr_user_without_companies_is_denied()
	{
		var (allowed, error) = TenantLoginValidator.ValidateCompanyAccessForLogin(
			["HR"],
			Array.Empty<UserCompanyAccessRecord>());

		Assert.False(allowed);
		Assert.Contains("No company assigned", error, StringComparison.OrdinalIgnoreCase);
	}

	[Fact]
	public void Hr_user_with_company_is_allowed()
	{
		var (allowed, error) = TenantLoginValidator.ValidateCompanyAccessForLogin(
			["HR"],
			[new UserCompanyAccessRecord(Guid.NewGuid(), Guid.NewGuid(), true)]);

		Assert.True(allowed);
		Assert.Null(error);
	}
}
