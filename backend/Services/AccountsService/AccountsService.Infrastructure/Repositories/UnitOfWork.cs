using AccountsService.Application;
using AccountsService.Domain;
using AccountsService.Infrastructure.Persistence;

namespace AccountsService.Infrastructure.Repositories;

public sealed class UnitOfWork(AccountsDbContext db) : IUnitOfWork
{
    public IRepository<ChartOfAccount> ChartOfAccounts { get; } = new EfRepository<ChartOfAccount>(db);
    public IRepository<FiscalYear> FiscalYears { get; } = new EfRepository<FiscalYear>(db);
    public IRepository<AccountingPeriod> AccountingPeriods { get; } = new EfRepository<AccountingPeriod>(db);
    public IRepository<Voucher> Vouchers { get; } = new EfRepository<Voucher>(db);
    public IRepository<CashReceipt> CashReceipts { get; } = new EfRepository<CashReceipt>(db);
    public IRepository<MoneyReceipt> MoneyReceipts { get; } = new EfRepository<MoneyReceipt>(db);
    public IRepository<DailyExpense> DailyExpenses { get; } = new EfRepository<DailyExpense>(db);
    public IRepository<MoneyRequest> MoneyRequests { get; } = new EfRepository<MoneyRequest>(db);
    public IRepository<AdvancePayment> AdvancePayments { get; } = new EfRepository<AdvancePayment>(db);
    public IRepository<AdvanceSalaryPayment> AdvanceSalaryPayments { get; } = new EfRepository<AdvanceSalaryPayment>(db);
    public IRepository<CompanyMoneyTransfer> CompanyMoneyTransfers { get; } = new EfRepository<CompanyMoneyTransfer>(db);
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
