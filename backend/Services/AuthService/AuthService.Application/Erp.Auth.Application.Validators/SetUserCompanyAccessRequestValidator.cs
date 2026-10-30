using AuthService.Contracts.CompanyAccess;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class SetUserCompanyAccessRequestValidator : AbstractValidator<SetUserCompanyAccessRequest>
{
	public SetUserCompanyAccessRequestValidator()
	{
		RuleForEach(x => x.Items).ChildRules(item =>
		{
			item.RuleFor(i => i.CompanyId).NotEmpty();
		});
	}
}
