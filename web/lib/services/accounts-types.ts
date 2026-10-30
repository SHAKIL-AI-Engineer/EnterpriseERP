/** Mirrors AccountsService.Contracts DTOs and requests. */

export const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Income", "Expense"] as const;
export const NORMAL_BALANCES = ["Debit", "Credit"] as const;
export const PAYMENT_METHODS = ["Cash", "Bank", "MFS", "Cheque"] as const;
export const RECEIVED_FROM_TYPES = ["Customer", "Buyer", "Employee", "Supplier", "Company", "Other"] as const;
export const ADVANCE_TYPES = [
  "EmployeeAdvance",
  "SupplierAdvance",
  "ExpenseAdvance",
  "TravelAdvance",
  "ProjectAdvance",
] as const;
export const PAID_TO_TYPES = ["Employee", "Supplier", "Department", "Other"] as const;
export const VOUCHER_TYPES = [
  "Journal",
  "Payment",
  "Receive",
  "Contra",
  "Purchase",
  "Sales",
  "Payroll",
  "Inventory",
  "Adjustment",
  "CashReceive",
  "DailyExpense",
  "AdvancePay",
  "AdvanceSalaryPay",
  "CompanyTransfer",
  "MoneyReceipt",
] as const;

export interface ChartOfAccountDto {
  id: string;
  companyId: string;
  accountCode: string;
  accountName: string;
  parentAccountId: string | null;
  accountType: string;
  normalBalance: string;
  isControlAccount: boolean;
  isCashAccount: boolean;
  isBankAccount: boolean;
  isActive: boolean;
}

export interface FiscalYearDto {
  id: string;
  companyId: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
}

export interface ExpenseCategoryDto {
  id: string;
  companyId: string;
  categoryCode: string;
  categoryName: string;
  expenseAccountId: string;
}

export interface VoucherLineDto {
  id: string;
  companyId: string;
  voucherId: string;
  accountId: string;
  costCenterId: string | null;
  debitAmount: number;
  creditAmount: number;
  description: string | null;
}

export interface VoucherDto {
  id: string;
  companyId: string;
  voucherNo: string;
  voucherDate: string;
  voucherType: string;
  referenceNo: string | null;
  narration: string | null;
  totalDebit: number;
  totalCredit: number;
  status: string;
  lines: VoucherLineDto[];
}

export interface GeneralLedgerEntryDto {
  id: string;
  companyId: string;
  voucherId: string;
  voucherLineId: string;
  accountId: string;
  costCenterId: string | null;
  transactionDate: string;
  debitAmount: number;
  creditAmount: number;
  balanceAmount: number;
  referenceNo: string | null;
}

export interface CashReceiptDto {
  id: string;
  companyId: string;
  receiptNo: string;
  receiptDate: string;
  receivedFromType: string;
  receivedFromId: string | null;
  cashOrBankAccountId: string;
  amount: number;
  paymentMethod: string;
  referenceNo: string | null;
  purpose: string | null;
  status: string;
  voucherId: string | null;
}

export interface MoneyReceiptDto {
  id: string;
  companyId: string;
  moneyReceiptNo: string;
  receiptDate: string;
  receivedFrom: string;
  receivedFromType: string;
  amount: number;
  paymentMethod: string;
  cashOrBankAccountId: string;
  description: string | null;
  voucherId: string | null;
  status: string;
}

export interface DailyExpenseDto {
  id: string;
  companyId: string;
  expenseNo: string;
  expenseDate: string;
  expenseCategoryId: string;
  paidFromAccountId: string;
  amount: number;
  paymentMethod: string;
  paidTo: string | null;
  description: string | null;
  status: string;
  voucherId: string | null;
}

export interface MoneyRequestDto {
  id: string;
  companyId: string;
  requestNo: string;
  requestDate: string;
  requestedBy: string;
  departmentId: string | null;
  purpose: string;
  requestedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  status: string;
  voucherId: string | null;
}

export interface AdvancePaymentDto {
  id: string;
  companyId: string;
  advanceNo: string;
  advanceDate: string;
  advanceType: string;
  paidToType: string;
  paidToId: string | null;
  paidToName: string | null;
  paidFromAccountId: string;
  amount: number;
  purpose: string | null;
  status: string;
  voucherId: string | null;
}

export interface AdvanceSalaryPaymentDto {
  id: string;
  companyId: string;
  employeeId: string;
  advanceSalaryNo: string;
  advanceDate: string;
  amount: number;
  deductionStartYear: number;
  deductionStartMonth: number;
  installmentAmount: number;
  paidFromAccountId: string;
  status: string;
  voucherId: string | null;
}

export interface CompanyMoneyTransferDto {
  id: string;
  companyId: string;
  transferNo: string;
  fromCompanyId: string;
  toCompanyId: string;
  fromAccountId: string;
  toAccountId: string;
  transferDate: string;
  amount: number;
  transferMethod: string;
  referenceNo: string | null;
  purpose: string | null;
  status: string;
  fromCompanyVoucherId: string | null;
  toCompanyVoucherId: string | null;
}

export interface FinancialReportLineDto {
  code: string;
  name: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface FinancialStatementDto {
  companyId: string;
  fromDate: string;
  toDate: string;
  lines: FinancialReportLineDto[];
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
}

export interface CreateChartOfAccountRequest {
  companyId: string;
  accountCode: string;
  accountName: string;
  parentAccountId?: string | null;
  accountType: string;
  normalBalance: string;
  isControlAccount: boolean;
  isCashAccount: boolean;
  isBankAccount: boolean;
  createdBy?: string | null;
}

export interface UpdateChartOfAccountRequest {
  accountName: string;
  parentAccountId?: string | null;
  accountType: string;
  normalBalance: string;
  isControlAccount: boolean;
  isCashAccount: boolean;
  isBankAccount: boolean;
  isActive: boolean;
  updatedBy?: string | null;
}

export interface CreateFiscalYearRequest {
  companyId: string;
  yearName: string;
  startDate: string;
  endDate: string;
  createdBy?: string | null;
}

export interface CreateVoucherLineRequest {
  accountId: string;
  costCenterId?: string | null;
  debitAmount: number;
  creditAmount: number;
  description?: string | null;
}

export interface CreateVoucherRequest {
  companyId: string;
  voucherNo: string;
  voucherDate: string;
  voucherType: string;
  referenceNo?: string | null;
  narration?: string | null;
  createdBy?: string | null;
  lines: CreateVoucherLineRequest[];
}

export interface CreateCashReceiptRequest {
  companyId: string;
  receiptNo: string;
  receiptDate: string;
  receivedFromType: string;
  receivedFromId?: string | null;
  cashOrBankAccountId: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string | null;
  purpose?: string | null;
  createdBy?: string | null;
}

export interface CreateMoneyReceiptRequest {
  companyId: string;
  moneyReceiptNo: string;
  receiptDate: string;
  receivedFrom: string;
  receivedFromType: string;
  amount: number;
  paymentMethod: string;
  cashOrBankAccountId: string;
  description?: string | null;
  createdBy?: string | null;
}

export interface CreateDailyExpenseRequest {
  companyId: string;
  expenseNo: string;
  expenseDate: string;
  expenseCategoryId: string;
  paidFromAccountId: string;
  amount: number;
  paymentMethod: string;
  paidTo?: string | null;
  description?: string | null;
  requestedBy?: string | null;
}

export interface CreateMoneyRequestRequest {
  companyId: string;
  requestNo: string;
  requestDate: string;
  requestedBy: string;
  departmentId?: string | null;
  purpose: string;
  requestedAmount: number;
}

export interface ApproveMoneyRequestRequest {
  approvedBy: string;
  approvedAmount: number;
}

export interface CreateAdvancePaymentRequest {
  companyId: string;
  advanceNo: string;
  advanceDate: string;
  advanceType: string;
  paidToType: string;
  paidToId?: string | null;
  paidToName?: string | null;
  paidFromAccountId: string;
  amount: number;
  purpose?: string | null;
  createdBy?: string | null;
}

export interface CreateAdvanceSalaryPaymentRequest {
  companyId: string;
  employeeId: string;
  advanceSalaryNo: string;
  advanceDate: string;
  amount: number;
  deductionStartYear: number;
  deductionStartMonth: number;
  installmentAmount: number;
  paidFromAccountId: string;
  createdBy?: string | null;
}

export interface CreateCompanyMoneyTransferRequest {
  transferNo: string;
  fromCompanyId: string;
  toCompanyId: string;
  fromAccountId: string;
  toAccountId: string;
  transferDate: string;
  amount: number;
  transferMethod: string;
  referenceNo?: string | null;
  purpose?: string | null;
  requestedBy?: string | null;
}

export interface ReportQueryParams {
  companyId: string;
  fromDate?: string;
  toDate?: string;
  asOfDate?: string;
  accountId?: string;
  date?: string;
  year?: number;
  month?: number;
}
