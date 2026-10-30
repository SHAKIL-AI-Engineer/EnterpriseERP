namespace AccountsService.Contracts;

public sealed record CreateChartOfAccountRequest(Guid CompanyId, string AccountCode, string AccountName, Guid? ParentAccountId, string AccountType, string NormalBalance, bool IsControlAccount, bool IsCashAccount, bool IsBankAccount, Guid? CreatedBy);
public sealed record UpdateChartOfAccountRequest(string AccountName, Guid? ParentAccountId, string AccountType, string NormalBalance, bool IsControlAccount, bool IsCashAccount, bool IsBankAccount, bool IsActive, Guid? UpdatedBy);
public sealed record CreateFiscalYearRequest(Guid CompanyId, string YearName, DateOnly StartDate, DateOnly EndDate, Guid? CreatedBy);
public sealed record CreateAccountingPeriodRequest(Guid CompanyId, Guid FiscalYearId, string PeriodName, DateOnly StartDate, DateOnly EndDate);
public sealed record CreateVoucherLineRequest(Guid AccountId, Guid? CostCenterId, decimal DebitAmount, decimal CreditAmount, string? Description);
public sealed record CreateVoucherRequest(Guid CompanyId, string VoucherNo, DateOnly VoucherDate, string VoucherType, string? ReferenceNo, string? Narration, Guid? CreatedBy, IReadOnlyList<CreateVoucherLineRequest> Lines);
public sealed record CreateCashReceiptRequest(Guid CompanyId, string ReceiptNo, DateOnly ReceiptDate, string ReceivedFromType, Guid? ReceivedFromId, Guid CashOrBankAccountId, decimal Amount, string PaymentMethod, string? ReferenceNo, string? Purpose, Guid? CreatedBy);
public sealed record CreateMoneyReceiptRequest(Guid CompanyId, string MoneyReceiptNo, DateOnly ReceiptDate, string ReceivedFrom, string ReceivedFromType, decimal Amount, string PaymentMethod, Guid CashOrBankAccountId, string? Description, Guid? CreatedBy);
public sealed record CreateDailyExpenseRequest(Guid CompanyId, string ExpenseNo, DateOnly ExpenseDate, Guid ExpenseCategoryId, Guid PaidFromAccountId, decimal Amount, string PaymentMethod, string? PaidTo, string? Description, Guid? RequestedBy);
public sealed record CreateMoneyRequestRequest(Guid CompanyId, string RequestNo, DateOnly RequestDate, Guid RequestedBy, Guid? DepartmentId, string Purpose, decimal RequestedAmount);
public sealed record ApproveMoneyRequestRequest(Guid ApprovedBy, decimal ApprovedAmount);
public sealed record CreateAdvancePaymentRequest(Guid CompanyId, string AdvanceNo, DateOnly AdvanceDate, string AdvanceType, string PaidToType, Guid? PaidToId, string? PaidToName, Guid PaidFromAccountId, decimal Amount, string? Purpose, Guid? CreatedBy);
public sealed record CreateAdvanceSalaryPaymentRequest(Guid CompanyId, Guid EmployeeId, string AdvanceSalaryNo, DateOnly AdvanceDate, decimal Amount, int DeductionStartYear, int DeductionStartMonth, decimal InstallmentAmount, Guid PaidFromAccountId, Guid? CreatedBy);
public sealed record CreateCompanyMoneyTransferRequest(string TransferNo, Guid FromCompanyId, Guid ToCompanyId, Guid FromAccountId, Guid ToAccountId, DateOnly TransferDate, decimal Amount, string TransferMethod, string? ReferenceNo, string? Purpose, Guid? RequestedBy);
