namespace AccountsService.Contracts;

public abstract record IntegrationEvent(string EventName, Guid CompanyId)
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}

public sealed record VoucherPosted(Guid CompanyId, Guid VoucherId, string VoucherNo, DateOnly VoucherDate, decimal TotalDebit, decimal TotalCredit) : IntegrationEvent(nameof(VoucherPosted), CompanyId);
public sealed record CashReceiptPosted(Guid CompanyId, Guid CashReceiptId, Guid VoucherId, decimal Amount) : IntegrationEvent(nameof(CashReceiptPosted), CompanyId);
public sealed record DailyExpensePaid(Guid CompanyId, Guid DailyExpenseId, Guid VoucherId, decimal Amount) : IntegrationEvent(nameof(DailyExpensePaid), CompanyId);
public sealed record MoneyRequestApproved(Guid CompanyId, Guid MoneyRequestId, decimal ApprovedAmount) : IntegrationEvent(nameof(MoneyRequestApproved), CompanyId);
public sealed record AdvancePaymentPaid(Guid CompanyId, Guid AdvancePaymentId, Guid VoucherId, decimal Amount) : IntegrationEvent(nameof(AdvancePaymentPaid), CompanyId);
public sealed record AdvanceSalaryPaid(Guid CompanyId, Guid EmployeeId, decimal Amount, int DeductionStartYear, int DeductionStartMonth, decimal InstallmentAmount) : IntegrationEvent(nameof(AdvanceSalaryPaid), CompanyId);
public sealed record CompanyMoneyTransferCompleted(Guid CompanyId, Guid TransferId, Guid FromCompanyId, Guid ToCompanyId, decimal Amount) : IntegrationEvent(nameof(CompanyMoneyTransferCompleted), CompanyId);
public sealed record SupplierPaymentCompleted(Guid CompanyId, Guid SupplierPayableId, decimal Amount) : IntegrationEvent(nameof(SupplierPaymentCompleted), CompanyId);
public sealed record CustomerReceiptCompleted(Guid CompanyId, Guid CustomerReceivableId, decimal Amount) : IntegrationEvent(nameof(CustomerReceiptCompleted), CompanyId);
