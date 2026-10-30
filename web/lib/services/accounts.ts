import api from "@/lib/api";
import { unwrapResponse } from "./api-helpers";
import type {
  AdvancePaymentDto,
  AdvanceSalaryPaymentDto,
  ApproveMoneyRequestRequest,
  CashReceiptDto,
  ChartOfAccountDto,
  CompanyMoneyTransferDto,
  CreateAdvancePaymentRequest,
  CreateAdvanceSalaryPaymentRequest,
  CreateCashReceiptRequest,
  CreateChartOfAccountRequest,
  CreateCompanyMoneyTransferRequest,
  CreateDailyExpenseRequest,
  CreateFiscalYearRequest,
  CreateMoneyReceiptRequest,
  CreateMoneyRequestRequest,
  CreateVoucherRequest,
  DailyExpenseDto,
  ExpenseCategoryDto,
  FinancialStatementDto,
  FiscalYearDto,
  GeneralLedgerEntryDto,
  MoneyReceiptDto,
  MoneyRequestDto,
  ReportQueryParams,
  UpdateChartOfAccountRequest,
  VoucherDto,
} from "./accounts-types";

function qs(params: object): Record<string, string | number> {
  const record = params as Record<string, string | number | undefined | null>;
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(record)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

export const accountsService = {
  // Master data
  getChartOfAccounts: (companyId: string) =>
    api.get<unknown>("chart-of-accounts", { params: { companyId } }).then((r) => unwrapResponse<ChartOfAccountDto[]>(r)),
  getChartOfAccount: (id: string) =>
    api.get<unknown>(`chart-of-accounts/${id}`).then((r) => unwrapResponse<ChartOfAccountDto>(r)),
  createChartOfAccount: (body: CreateChartOfAccountRequest) =>
    api.post<unknown>("chart-of-accounts", body).then((r) => unwrapResponse<ChartOfAccountDto>(r)),
  updateChartOfAccount: (id: string, body: UpdateChartOfAccountRequest) =>
    api.put<unknown>(`chart-of-accounts/${id}`, body).then((r) => unwrapResponse<ChartOfAccountDto>(r)),
  activateChartOfAccount: (id: string) =>
    api.patch<unknown>(`chart-of-accounts/${id}/activate`).then((r) => unwrapResponse<ChartOfAccountDto>(r)),
  deactivateChartOfAccount: (id: string) =>
    api.patch<unknown>(`chart-of-accounts/${id}/deactivate`).then((r) => unwrapResponse<ChartOfAccountDto>(r)),

  getFiscalYears: (companyId: string) =>
    api.get<unknown>("fiscal-years", { params: { companyId } }).then((r) => unwrapResponse<FiscalYearDto[]>(r)),
  createFiscalYear: (body: CreateFiscalYearRequest) =>
    api.post<unknown>("fiscal-years", body).then((r) => unwrapResponse<FiscalYearDto>(r)),
  closeFiscalYear: (id: string, userId?: string) =>
    api
      .patch<unknown>(`fiscal-years/${id}/close`, null, { params: qs({ userId }) })
      .then((r) => unwrapResponse<FiscalYearDto>(r)),

  getExpenseCategories: (companyId: string) =>
    api
      .get<unknown>("expense-categories", { params: { companyId } })
      .then((r) => unwrapResponse<ExpenseCategoryDto[]>(r)),

  // Vouchers
  getVouchers: (params: { companyId: string; fromDate?: string; toDate?: string; type?: string }) =>
    api.get<unknown>("vouchers", { params: qs(params) }).then((r) => unwrapResponse<VoucherDto[]>(r)),
  getVoucher: (id: string) => api.get<unknown>(`vouchers/${id}`).then((r) => unwrapResponse<VoucherDto>(r)),
  createVoucher: (body: CreateVoucherRequest) =>
    api.post<unknown>("vouchers", body).then((r) => unwrapResponse<VoucherDto>(r)),
  submitVoucher: (id: string, userId?: string) =>
    api.patch<unknown>(`vouchers/${id}/submit`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<VoucherDto>(r)),
  approveVoucher: (id: string, userId?: string) =>
    api.patch<unknown>(`vouchers/${id}/approve`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<VoucherDto>(r)),
  postVoucher: (id: string, userId?: string) =>
    api.patch<unknown>(`vouchers/${id}/post`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<VoucherDto>(r)),
  cancelVoucher: (id: string, userId?: string) =>
    api.patch<unknown>(`vouchers/${id}/cancel`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<VoucherDto>(r)),

  // Cash receipts
  getCashReceipts: (params: { companyId: string; fromDate?: string; toDate?: string }) =>
    api.get<unknown>("cash-receipts", { params: qs(params) }).then((r) => unwrapResponse<CashReceiptDto[]>(r)),
  getCashReceipt: (id: string) => api.get<unknown>(`cash-receipts/${id}`).then((r) => unwrapResponse<CashReceiptDto>(r)),
  createCashReceipt: (body: CreateCashReceiptRequest) =>
    api.post<unknown>("cash-receipts", body).then((r) => unwrapResponse<CashReceiptDto>(r)),
  approveCashReceipt: (id: string, userId?: string) =>
    api.patch<unknown>(`cash-receipts/${id}/approve`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<CashReceiptDto>(r)),
  postCashReceipt: (id: string, userId?: string) =>
    api.patch<unknown>(`cash-receipts/${id}/post`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<CashReceiptDto>(r)),
  cancelCashReceipt: (id: string, userId?: string) =>
    api.patch<unknown>(`cash-receipts/${id}/cancel`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<CashReceiptDto>(r)),

  // Money receipts
  getMoneyReceipts: (params: { companyId: string; fromDate?: string; toDate?: string }) =>
    api.get<unknown>("money-receipts", { params: qs(params) }).then((r) => unwrapResponse<MoneyReceiptDto[]>(r)),
  getMoneyReceipt: (id: string) => api.get<unknown>(`money-receipts/${id}`).then((r) => unwrapResponse<MoneyReceiptDto>(r)),
  createMoneyReceipt: (body: CreateMoneyReceiptRequest) =>
    api.post<unknown>("money-receipts", body).then((r) => unwrapResponse<MoneyReceiptDto>(r)),
  approveMoneyReceipt: (id: string, userId?: string) =>
    api.patch<unknown>(`money-receipts/${id}/approve`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<MoneyReceiptDto>(r)),
  postMoneyReceipt: (id: string, userId?: string) =>
    api.patch<unknown>(`money-receipts/${id}/post`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<MoneyReceiptDto>(r)),

  // Daily expenses
  getDailyExpenses: (params: { companyId: string; fromDate?: string; toDate?: string }) =>
    api.get<unknown>("daily-expenses", { params: qs(params) }).then((r) => unwrapResponse<DailyExpenseDto[]>(r)),
  getDailyExpense: (id: string) => api.get<unknown>(`daily-expenses/${id}`).then((r) => unwrapResponse<DailyExpenseDto>(r)),
  createDailyExpense: (body: CreateDailyExpenseRequest) =>
    api.post<unknown>("daily-expenses", body).then((r) => unwrapResponse<DailyExpenseDto>(r)),
  approveDailyExpense: (id: string, userId?: string) =>
    api.patch<unknown>(`daily-expenses/${id}/approve`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<DailyExpenseDto>(r)),
  payDailyExpense: (id: string, userId?: string) =>
    api.patch<unknown>(`daily-expenses/${id}/pay`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<DailyExpenseDto>(r)),
  rejectDailyExpense: (id: string, userId?: string) =>
    api.patch<unknown>(`daily-expenses/${id}/reject`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<DailyExpenseDto>(r)),

  // Money requests
  getMoneyRequests: (params: { companyId: string; status?: string }) =>
    api.get<unknown>("money-requests", { params: qs(params) }).then((r) => unwrapResponse<MoneyRequestDto[]>(r)),
  getMoneyRequest: (id: string) => api.get<unknown>(`money-requests/${id}`).then((r) => unwrapResponse<MoneyRequestDto>(r)),
  createMoneyRequest: (body: CreateMoneyRequestRequest) =>
    api.post<unknown>("money-requests", body).then((r) => unwrapResponse<MoneyRequestDto>(r)),
  approveMoneyRequest: (id: string, body: ApproveMoneyRequestRequest) =>
    api.patch<unknown>(`money-requests/${id}/approve`, body).then((r) => unwrapResponse<MoneyRequestDto>(r)),
  rejectMoneyRequest: (id: string, userId?: string) =>
    api.patch<unknown>(`money-requests/${id}/reject`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<MoneyRequestDto>(r)),
  payMoneyRequest: (id: string, userId?: string) =>
    api.patch<unknown>(`money-requests/${id}/pay`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<MoneyRequestDto>(r)),

  // Advance payments
  getAdvancePayments: (params: { companyId: string; fromDate?: string; toDate?: string }) =>
    api.get<unknown>("advance-payments", { params: qs(params) }).then((r) => unwrapResponse<AdvancePaymentDto[]>(r)),
  getAdvancePayment: (id: string) => api.get<unknown>(`advance-payments/${id}`).then((r) => unwrapResponse<AdvancePaymentDto>(r)),
  createAdvancePayment: (body: CreateAdvancePaymentRequest) =>
    api.post<unknown>("advance-payments", body).then((r) => unwrapResponse<AdvancePaymentDto>(r)),
  approveAdvancePayment: (id: string, userId?: string) =>
    api.patch<unknown>(`advance-payments/${id}/approve`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<AdvancePaymentDto>(r)),
  payAdvancePayment: (id: string, userId?: string) =>
    api.patch<unknown>(`advance-payments/${id}/pay`, null, { params: qs({ userId }) }).then((r) => unwrapResponse<AdvancePaymentDto>(r)),

  // Advance salary
  getAdvanceSalaryPayments: (params: { companyId: string; employeeId?: string }) =>
    api.get<unknown>("advance-salary-payments", { params: qs(params) }).then((r) => unwrapResponse<AdvanceSalaryPaymentDto[]>(r)),
  getAdvanceSalaryPayment: (id: string) =>
    api.get<unknown>(`advance-salary-payments/${id}`).then((r) => unwrapResponse<AdvanceSalaryPaymentDto>(r)),
  createAdvanceSalaryPayment: (body: CreateAdvanceSalaryPaymentRequest) =>
    api.post<unknown>("advance-salary-payments", body).then((r) => unwrapResponse<AdvanceSalaryPaymentDto>(r)),
  approveAdvanceSalaryPayment: (id: string, userId?: string) =>
    api
      .patch<unknown>(`advance-salary-payments/${id}/approve`, null, { params: qs({ userId }) })
      .then((r) => unwrapResponse<AdvanceSalaryPaymentDto>(r)),
  payAdvanceSalaryPayment: (id: string, userId?: string) =>
    api
      .patch<unknown>(`advance-salary-payments/${id}/pay`, null, { params: qs({ userId }) })
      .then((r) => unwrapResponse<AdvanceSalaryPaymentDto>(r)),

  // Company transfers
  getCompanyMoneyTransfers: (params: { fromCompanyId?: string; toCompanyId?: string }) =>
    api.get<unknown>("company-money-transfers", { params: qs(params) }).then((r) => unwrapResponse<CompanyMoneyTransferDto[]>(r)),
  getCompanyMoneyTransfer: (id: string) =>
    api.get<unknown>(`company-money-transfers/${id}`).then((r) => unwrapResponse<CompanyMoneyTransferDto>(r)),
  createCompanyMoneyTransfer: (body: CreateCompanyMoneyTransferRequest) =>
    api.post<unknown>("company-money-transfers", body).then((r) => unwrapResponse<CompanyMoneyTransferDto>(r)),
  approveCompanyMoneyTransfer: (id: string, userId?: string) =>
    api
      .patch<unknown>(`company-money-transfers/${id}/approve`, null, { params: qs({ userId }) })
      .then((r) => unwrapResponse<CompanyMoneyTransferDto>(r)),
  transferCompanyMoney: (id: string, userId?: string) =>
    api
      .patch<unknown>(`company-money-transfers/${id}/transfer`, null, { params: qs({ userId }) })
      .then((r) => unwrapResponse<CompanyMoneyTransferDto>(r)),
  rejectCompanyMoneyTransfer: (id: string, userId?: string) =>
    api
      .patch<unknown>(`company-money-transfers/${id}/reject`, null, { params: qs({ userId }) })
      .then((r) => unwrapResponse<CompanyMoneyTransferDto>(r)),

  // Reports (JSON)
  getLedger: (p: ReportQueryParams & { accountId?: string }) =>
    api.get<unknown>("ledger", { params: qs(p) }).then((r) => unwrapResponse<GeneralLedgerEntryDto[]>(r)),
  getCashBook: (p: ReportQueryParams) =>
    api.get<unknown>("cash-book", { params: qs(p) }).then((r) => unwrapResponse<GeneralLedgerEntryDto[]>(r)),
  getBankBook: (p: ReportQueryParams) =>
    api.get<unknown>("bank-book", { params: qs(p) }).then((r) => unwrapResponse<GeneralLedgerEntryDto[]>(r)),
  getDailyExpenseReport: (p: ReportQueryParams) =>
    api.get<unknown>("daily-expense-report", { params: qs(p) }).then((r) => unwrapResponse<FinancialStatementDto>(r)),
  getMonthlyExpenseReport: (p: ReportQueryParams) =>
    api.get<unknown>("monthly-expense-report", { params: qs(p) }).then((r) => unwrapResponse<FinancialStatementDto>(r)),
  getTrialBalance: (p: ReportQueryParams) =>
    api.get<unknown>("trial-balance", { params: qs(p) }).then((r) => unwrapResponse<FinancialStatementDto>(r)),
  getProfitLoss: (p: ReportQueryParams) =>
    api.get<unknown>("profit-loss", { params: qs(p) }).then((r) => unwrapResponse<FinancialStatementDto>(r)),
  getBalanceSheet: (p: ReportQueryParams) =>
    api.get<unknown>("balance-sheet", { params: qs(p) }).then((r) => unwrapResponse<FinancialStatementDto>(r)),
  getCashFlow: (p: ReportQueryParams) =>
    api.get<unknown>("cash-flow", { params: qs(p) }).then((r) => unwrapResponse<FinancialStatementDto>(r)),
  getCompanyTransferReport: (p: ReportQueryParams) =>
    api
      .get<unknown>("company-transfer-report", { params: qs(p) })
      .then((r) => unwrapResponse<CompanyMoneyTransferDto[]>(r)),

  // Report exports (blob)
  exportReport: (path: string, params: ReportQueryParams, ext: "csv" | "xlsx" | "pdf") =>
    api.get<Blob>(`${path}/export.${ext}`, { params: qs(params), responseType: "blob" }),
};

export type { ChartOfAccountDto, VoucherDto, CashReceiptDto, DailyExpenseDto, FinancialStatementDto };
