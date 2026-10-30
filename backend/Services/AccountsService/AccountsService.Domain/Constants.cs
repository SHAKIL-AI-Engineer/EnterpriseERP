namespace AccountsService.Domain;

public static class AccountTypes
{
    public const string Asset = "Asset";
    public const string Liability = "Liability";
    public const string Equity = "Equity";
    public const string Income = "Income";
    public const string Expense = "Expense";
    public static readonly string[] Values = [Asset, Liability, Equity, Income, Expense];
}

public static class NormalBalances
{
    public const string Debit = "Debit";
    public const string Credit = "Credit";
    public static readonly string[] Values = [Debit, Credit];
}

public static class VoucherTypes
{
    public const string Journal = "Journal";
    public const string Payment = "Payment";
    public const string Receive = "Receive";
    public const string Contra = "Contra";
    public const string Purchase = "Purchase";
    public const string Sales = "Sales";
    public const string Payroll = "Payroll";
    public const string Inventory = "Inventory";
    public const string Adjustment = "Adjustment";
    public const string CashReceive = "CashReceive";
    public const string DailyExpense = "DailyExpense";
    public const string AdvancePay = "AdvancePay";
    public const string AdvanceSalaryPay = "AdvanceSalaryPay";
    public const string CompanyTransfer = "CompanyTransfer";
    public const string MoneyReceipt = "MoneyReceipt";
    public static readonly string[] Values = [Journal, Payment, Receive, Contra, Purchase, Sales, Payroll, Inventory, Adjustment, CashReceive, DailyExpense, AdvancePay, AdvanceSalaryPay, CompanyTransfer, MoneyReceipt];
}

public static class VoucherStatuses
{
    public const string Draft = "Draft";
    public const string Submitted = "Submitted";
    public const string Approved = "Approved";
    public const string Posted = "Posted";
    public const string Cancelled = "Cancelled";
}

public static class WorkflowStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Paid = "Paid";
    public const string Transferred = "Transferred";
    public const string Cancelled = "Cancelled";
    public const string Draft = "Draft";
    public const string Posted = "Posted";
    public const string Open = "Open";
    public const string Closed = "Closed";
}

public static class PaymentMethods
{
    public static readonly string[] Values = ["Cash", "Bank", "MFS", "Cheque"];
}

public static class ReceivedFromTypes
{
    public static readonly string[] Values = ["Customer", "Buyer", "Employee", "Supplier", "Company", "Other"];
}

public static class AdvanceTypes
{
    public static readonly string[] Values = ["EmployeeAdvance", "SupplierAdvance", "ExpenseAdvance", "TravelAdvance", "ProjectAdvance"];
}

public static class PaidToTypes
{
    public static readonly string[] Values = ["Employee", "Supplier", "Department", "Other"];
}

public static class AccountsRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string GroupAdmin = "GroupAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string AccountsManager = "AccountsManager";
    public const string AccountsOfficer = "AccountsOfficer";
    public const string Cashier = "Cashier";
    public const string Auditor = "Auditor";
    public const string Viewer = "Viewer";
}

public static class AccountsPermissions
{
    public const string CoaManage = "COA_MANAGE";
    public const string VoucherCreate = "VOUCHER_CREATE";
    public const string VoucherApprove = "VOUCHER_APPROVE";
    public const string VoucherPost = "VOUCHER_POST";
    public const string CashReceiveCreate = "CASH_RECEIVE_CREATE";
    public const string CashReceiveApprove = "CASH_RECEIVE_APPROVE";
    public const string DailyExpenseCreate = "DAILY_EXPENSE_CREATE";
    public const string DailyExpenseApprove = "DAILY_EXPENSE_APPROVE";
    public const string MoneyRequestCreate = "MONEY_REQUEST_CREATE";
    public const string MoneyRequestApprove = "MONEY_REQUEST_APPROVE";
    public const string AdvancePayCreate = "ADVANCE_PAY_CREATE";
    public const string AdvancePayApprove = "ADVANCE_PAY_APPROVE";
    public const string AdvanceSalaryPayCreate = "ADVANCE_SALARY_PAY_CREATE";
    public const string AdvanceSalaryPayApprove = "ADVANCE_SALARY_PAY_APPROVE";
    public const string CompanyTransferCreate = "COMPANY_TRANSFER_CREATE";
    public const string CompanyTransferApprove = "COMPANY_TRANSFER_APPROVE";
    public const string LedgerView = "LEDGER_VIEW";
    public const string ReportView = "REPORT_VIEW";
}
