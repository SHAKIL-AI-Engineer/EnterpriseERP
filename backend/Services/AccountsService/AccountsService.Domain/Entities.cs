using Erp.BuildingBlocks.SharedKernel;

namespace AccountsService.Domain;

public abstract class AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public sealed class ChartOfAccount : AuditableEntity
{
    public string AccountCode { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public Guid? ParentAccountId { get; set; }
    public string AccountType { get; set; } = AccountTypes.Asset;
    public string NormalBalance { get; set; } = NormalBalances.Debit;
    public bool IsControlAccount { get; set; }
    public bool IsCashAccount { get; set; }
    public bool IsBankAccount { get; set; }
    public bool IsActive { get; set; } = true;
    public ChartOfAccount? ParentAccount { get; set; }
    public ICollection<ChartOfAccount> Children { get; set; } = [];
}

public sealed class FiscalYear : AuditableEntity
{
    public string YearName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsClosed { get; set; }
    public Guid? ClosedBy { get; set; }
    public DateTime? ClosedAt { get; set; }
    public ICollection<AccountingPeriod> AccountingPeriods { get; set; } = [];
}

public sealed class AccountingPeriod : AuditableEntity
{
    public Guid FiscalYearId { get; set; }
    public string PeriodName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsClosed { get; set; }
    public Guid? ClosedBy { get; set; }
    public DateTime? ClosedAt { get; set; }
    public FiscalYear? FiscalYear { get; set; }
}

public sealed class CostCenter : AuditableEntity
{
    public string CostCenterCode { get; set; } = string.Empty;
    public string CostCenterName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class Voucher : AuditableEntity
{
    public string VoucherNo { get; set; } = string.Empty;
    public DateOnly VoucherDate { get; set; }
    public string VoucherType { get; set; } = VoucherTypes.Journal;
    public string? ReferenceNo { get; set; }
    public string? Narration { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public string Status { get; set; } = VoucherStatuses.Draft;
    public Guid? SubmittedBy { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? PostedBy { get; set; }
    public DateTime? PostedAt { get; set; }
    public Guid? CancelledBy { get; set; }
    public DateTime? CancelledAt { get; set; }
    public ICollection<VoucherLine> Lines { get; set; } = [];
}

public sealed class VoucherLine : AuditableEntity
{
    public Guid VoucherId { get; set; }
    public Guid AccountId { get; set; }
    public Guid? CostCenterId { get; set; }
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
    public string? Description { get; set; }
    public Voucher? Voucher { get; set; }
    public ChartOfAccount? Account { get; set; }
    public CostCenter? CostCenter { get; set; }
}

public sealed class GeneralLedgerEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid VoucherId { get; set; }
    public Guid VoucherLineId { get; set; }
    public Guid AccountId { get; set; }
    public Guid? CostCenterId { get; set; }
    public DateOnly TransactionDate { get; set; }
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string? ReferenceNo { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
}

public sealed class BankAccount : AuditableEntity
{
    public Guid AccountId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string? BranchName { get; set; }
    public string AccountNo { get; set; } = string.Empty;
    public string? RoutingNo { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class CashReceipt : AuditableEntity
{
    public string ReceiptNo { get; set; } = string.Empty;
    public DateOnly ReceiptDate { get; set; }
    public string ReceivedFromType { get; set; } = "Other";
    public Guid? ReceivedFromId { get; set; }
    public Guid CashOrBankAccountId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? ReferenceNo { get; set; }
    public string? Purpose { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Draft;
    public Guid? VoucherId { get; set; }
}

public sealed class MoneyReceipt : AuditableEntity
{
    public string MoneyReceiptNo { get; set; } = string.Empty;
    public DateOnly ReceiptDate { get; set; }
    public string ReceivedFrom { get; set; } = string.Empty;
    public string ReceivedFromType { get; set; } = "Other";
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public Guid CashOrBankAccountId { get; set; }
    public string? Description { get; set; }
    public Guid? VoucherId { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Draft;
}

public sealed class ExpenseCategory : AuditableEntity
{
    public string CategoryCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public Guid ExpenseAccountId { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class DailyExpense : AuditableEntity
{
    public string ExpenseNo { get; set; } = string.Empty;
    public DateOnly ExpenseDate { get; set; }
    public Guid ExpenseCategoryId { get; set; }
    public Guid PaidFromAccountId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? PaidTo { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Pending;
    public Guid? VoucherId { get; set; }
    public Guid? RequestedBy { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public sealed class MoneyRequest : AuditableEntity
{
    public string RequestNo { get; set; } = string.Empty;
    public DateOnly RequestDate { get; set; }
    public Guid RequestedBy { get; set; }
    public Guid? DepartmentId { get; set; }
    public string Purpose { get; set; } = string.Empty;
    public decimal RequestedAmount { get; set; }
    public decimal ApprovedAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Pending;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Guid? PaidBy { get; set; }
    public DateTime? PaidAt { get; set; }
    public Guid? VoucherId { get; set; }
}

public sealed class AdvancePayment : AuditableEntity
{
    public string AdvanceNo { get; set; } = string.Empty;
    public DateOnly AdvanceDate { get; set; }
    public string AdvanceType { get; set; } = "EmployeeAdvance";
    public string PaidToType { get; set; } = "Other";
    public Guid? PaidToId { get; set; }
    public string? PaidToName { get; set; }
    public Guid PaidFromAccountId { get; set; }
    public decimal Amount { get; set; }
    public string? Purpose { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Pending;
    public Guid? VoucherId { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public sealed class AdvanceSalaryPayment : AuditableEntity
{
    public Guid EmployeeId { get; set; }
    public string AdvanceSalaryNo { get; set; } = string.Empty;
    public DateOnly AdvanceDate { get; set; }
    public decimal Amount { get; set; }
    public int DeductionStartYear { get; set; }
    public int DeductionStartMonth { get; set; }
    public decimal InstallmentAmount { get; set; }
    public Guid PaidFromAccountId { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Pending;
    public Guid? VoucherId { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public sealed class CompanyMoneyTransfer : AuditableEntity
{
    public string TransferNo { get; set; } = string.Empty;
    public Guid FromCompanyId { get; set; }
    public Guid ToCompanyId { get; set; }
    public Guid FromAccountId { get; set; }
    public Guid ToAccountId { get; set; }
    public DateOnly TransferDate { get; set; }
    public decimal Amount { get; set; }
    public string TransferMethod { get; set; } = "Bank";
    public string? ReferenceNo { get; set; }
    public string? Purpose { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Pending;
    public Guid? FromCompanyVoucherId { get; set; }
    public Guid? ToCompanyVoucherId { get; set; }
    public Guid? RequestedBy { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public sealed class SupplierPayable : AuditableEntity
{
    public Guid SupplierId { get; set; }
    public Guid? PurchaseOrderId { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public DateOnly InvoiceDate { get; set; }
    public decimal InvoiceAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Open;
    public Guid? VoucherId { get; set; }
}

public sealed class CustomerReceivable : AuditableEntity
{
    public Guid BuyerId { get; set; }
    public Guid? OrderId { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public DateOnly InvoiceDate { get; set; }
    public decimal InvoiceAmount { get; set; }
    public decimal ReceivedAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Open;
    public Guid? VoucherId { get; set; }
}

public sealed class AccountsAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public Guid? UserId { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
}
