using FluentValidation;
using PayrollService.Contracts;

namespace PayrollService.Application;

public sealed class ProcessPayrollCommandValidator : AbstractValidator<ProcessPayrollCommand>
{
    public ProcessPayrollCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.YearNo).GreaterThan(2000);
        RuleFor(x => x.Request.MonthNo).InclusiveBetween(1, 12);
    }
}

public sealed class AssignEmployeeSalaryCommandValidator : AbstractValidator<AssignEmployeeSalaryCommand>
{
    public AssignEmployeeSalaryCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.EmployeeId).NotEmpty();
        RuleFor(x => x.Request.GrossSalary).GreaterThan(0);
        RuleFor(x => x.Request.BasicSalary).GreaterThan(0);
        RuleFor(x => x.Request.EffectiveFrom).NotEmpty();
    }
}

public sealed class CreateSalaryIncrementCommandValidator : AbstractValidator<CreateSalaryIncrementCommand>
{
    public CreateSalaryIncrementCommandValidator()
    {
        RuleFor(x => x.Request.NewGrossSalary).GreaterThan(x => x.Request.OldGrossSalary);
        RuleFor(x => x.Request.EffectiveFrom).NotEmpty();
        RuleFor(x => x.Request.Reason).NotEmpty();
    }
}

public sealed class AssignCompanyPayrollPolicyCommandValidator : AbstractValidator<AssignCompanyPayrollPolicyCommand>
{
    public AssignCompanyPayrollPolicyCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.PolicyCode).NotEmpty();
        RuleFor(x => x.Request.EffectiveFrom).NotEmpty();
    }
}

public sealed class CreateSalaryAdvanceCommandValidator : AbstractValidator<CreateSalaryAdvanceCommand>
{
    public CreateSalaryAdvanceCommandValidator()
    {
        RuleFor(x => x.Request.AdvanceAmount).GreaterThan(0);
        RuleFor(x => x.Request.InstallmentAmount).GreaterThan(0);
        RuleFor(x => x.Request.DeductionStartMonth).InclusiveBetween(1, 12);
    }
}

public sealed class CreateAllowanceBillCommandValidator : AbstractValidator<CreateAllowanceBillCommand>
{
    public CreateAllowanceBillCommandValidator()
    {
        RuleFor(x => x.Request.EmployeeId).NotEmpty();
        RuleFor(x => x.Request.AllowanceType).NotEmpty();
        RuleFor(x => x.Request.Amount).GreaterThan(0);
    }
}
