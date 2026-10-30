using AccountsService.Contracts;
using AccountsService.Domain;

namespace AccountsService.Application;

public interface IAccountsDbContext
{
    IQueryable<ChartOfAccount> ChartOfAccounts { get; }
    IQueryable<FiscalYear> FiscalYears { get; }
    IQueryable<AccountingPeriod> AccountingPeriods { get; }
    IQueryable<CostCenter> CostCenters { get; }
    IQueryable<Voucher> Vouchers { get; }
    IQueryable<VoucherLine> VoucherLines { get; }
    IQueryable<GeneralLedgerEntry> GeneralLedgerEntries { get; }
    IQueryable<BankAccount> BankAccounts { get; }
    IQueryable<CashReceipt> CashReceipts { get; }
    IQueryable<MoneyReceipt> MoneyReceipts { get; }
    IQueryable<ExpenseCategory> ExpenseCategories { get; }
    IQueryable<DailyExpense> DailyExpenses { get; }
    IQueryable<MoneyRequest> MoneyRequests { get; }
    IQueryable<AdvancePayment> AdvancePayments { get; }
    IQueryable<AdvanceSalaryPayment> AdvanceSalaryPayments { get; }
    IQueryable<CompanyMoneyTransfer> CompanyMoneyTransfers { get; }
    IQueryable<SupplierPayable> SupplierPayables { get; }
    IQueryable<CustomerReceivable> CustomerReceivables { get; }
    IQueryable<AccountsAuditLog> AuditLogs { get; }
    void Add<TEntity>(TEntity entity) where TEntity : class;
    void Remove<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRepository<TEntity> where TEntity : class
{
    IQueryable<TEntity> Query();
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);
    void Remove(TEntity entity);
}

public interface IUnitOfWork
{
    IRepository<ChartOfAccount> ChartOfAccounts { get; }
    IRepository<FiscalYear> FiscalYears { get; }
    IRepository<AccountingPeriod> AccountingPeriods { get; }
    IRepository<Voucher> Vouchers { get; }
    IRepository<CashReceipt> CashReceipts { get; }
    IRepository<MoneyReceipt> MoneyReceipts { get; }
    IRepository<DailyExpense> DailyExpenses { get; }
    IRepository<MoneyRequest> MoneyRequests { get; }
    IRepository<AdvancePayment> AdvancePayments { get; }
    IRepository<AdvanceSalaryPayment> AdvanceSalaryPayments { get; }
    IRepository<CompanyMoneyTransfer> CompanyMoneyTransfers { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IIntegrationEventPublisher
{
    Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent;
}

public interface IVoucherPostingService
{
    Task ValidateBalancedAndOpenPeriodAsync(Voucher voucher, CancellationToken cancellationToken = default);
    Task PostAsync(Voucher voucher, Guid? postedBy, CancellationToken cancellationToken = default);
    Voucher BuildVoucher(Guid companyId, string voucherNo, DateOnly date, string type, string? referenceNo, string? narration, Guid? createdBy, params VoucherLineDraft[] lines);
}

public interface IReportService
{
    Task<IReadOnlyList<GeneralLedgerEntryDto>> GetLedgerAsync(Guid companyId, Guid? accountId, DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GeneralLedgerEntryDto>> GetCashBookAsync(Guid companyId, DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GeneralLedgerEntryDto>> GetBankBookAsync(Guid companyId, DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default);
    Task<FinancialStatementDto> GetTrialBalanceAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
    Task<FinancialStatementDto> GetProfitLossAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
    Task<FinancialStatementDto> GetBalanceSheetAsync(Guid companyId, DateOnly asOfDate, CancellationToken cancellationToken = default);
    Task<FinancialStatementDto> GetCashFlowAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
}

public sealed record VoucherLineDraft(Guid AccountId, Guid? CostCenterId, decimal DebitAmount, decimal CreditAmount, string? Description);

public interface ICompanyServiceClient
{
    Task<bool> CompanyExistsAsync(Guid companyId, CancellationToken cancellationToken = default);
}

public interface IReportExportClient
{
    Task<ReportExportFile> ExportAsync(ReportExportRequestDto request, string? bearerToken, CancellationToken cancellationToken = default);
}
