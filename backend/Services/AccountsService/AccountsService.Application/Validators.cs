using AccountsService.Contracts;
using AccountsService.Domain;
using FluentValidation;

namespace AccountsService.Application;

public sealed class CreateChartOfAccountRequestValidator : AbstractValidator<CreateChartOfAccountRequest>
{
    public CreateChartOfAccountRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.AccountCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.AccountName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.AccountType).Must(x => AccountTypes.Values.Contains(x)).WithMessage("Invalid account type.");
        RuleFor(x => x.NormalBalance).Must(x => NormalBalances.Values.Contains(x)).WithMessage("Invalid normal balance.");
    }
}

public sealed class CreateFiscalYearRequestValidator : AbstractValidator<CreateFiscalYearRequest>
{
    public CreateFiscalYearRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.YearName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.EndDate).GreaterThan(x => x.StartDate);
    }
}

public sealed class CreateVoucherRequestValidator : AbstractValidator<CreateVoucherRequest>
{
    public CreateVoucherRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.VoucherNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.VoucherDate).NotEmpty();
        RuleFor(x => x.VoucherType).Must(x => VoucherTypes.Values.Contains(x)).WithMessage("Invalid voucher type.");
        RuleFor(x => x.Lines).Must(x => x.Count >= 2).WithMessage("Voucher must have at least two lines.");
        RuleFor(x => x.Lines.Sum(l => l.DebitAmount)).Equal(x => x.Lines.Sum(l => l.CreditAmount)).WithMessage("Total debit must equal total credit.");
        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            line.RuleFor(x => x.AccountId).NotEmpty();
            line.RuleFor(x => x).Must(x => x.DebitAmount > 0 ^ x.CreditAmount > 0).WithMessage("Each voucher line must have either debit or credit amount.");
        });
    }
}

public sealed class CreateCashReceiptRequestValidator : AbstractValidator<CreateCashReceiptRequest>
{
    public CreateCashReceiptRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.ReceiptDate).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.CashOrBankAccountId).NotEmpty();
        RuleFor(x => x.PaymentMethod).Must(x => PaymentMethods.Values.Contains(x)).WithMessage("Invalid payment method.");
    }
}

public sealed class CreateDailyExpenseRequestValidator : AbstractValidator<CreateDailyExpenseRequest>
{
    public CreateDailyExpenseRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.ExpenseDate).NotEmpty();
        RuleFor(x => x.ExpenseCategoryId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.PaidFromAccountId).NotEmpty();
    }
}

public sealed class CreateMoneyRequestRequestValidator : AbstractValidator<CreateMoneyRequestRequest>
{
    public CreateMoneyRequestRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.RequestedAmount).GreaterThan(0);
        RuleFor(x => x.Purpose).NotEmpty().MaximumLength(500);
    }
}

public sealed class CreateAdvancePaymentRequestValidator : AbstractValidator<CreateAdvancePaymentRequest>
{
    public CreateAdvancePaymentRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.PaidFromAccountId).NotEmpty();
        RuleFor(x => x.AdvanceType).Must(x => AdvanceTypes.Values.Contains(x)).WithMessage("Invalid advance type.");
        RuleFor(x => x.PaidToType).Must(x => PaidToTypes.Values.Contains(x)).WithMessage("Invalid paid-to type.");
    }
}

public sealed class CreateAdvanceSalaryPaymentRequestValidator : AbstractValidator<CreateAdvanceSalaryPaymentRequest>
{
    public CreateAdvanceSalaryPaymentRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.EmployeeId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.InstallmentAmount).GreaterThan(0);
        RuleFor(x => x.PaidFromAccountId).NotEmpty();
    }
}

public sealed class CreateCompanyMoneyTransferRequestValidator : AbstractValidator<CreateCompanyMoneyTransferRequest>
{
    public CreateCompanyMoneyTransferRequestValidator()
    {
        RuleFor(x => x.FromCompanyId).NotEmpty();
        RuleFor(x => x.ToCompanyId).NotEmpty();
        RuleFor(x => x.ToCompanyId).NotEqual(x => x.FromCompanyId);
        RuleFor(x => x.FromAccountId).NotEmpty();
        RuleFor(x => x.ToAccountId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
    }
}
