using AccountsService.Application;
using AccountsService.Domain;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace AccountsService.Infrastructure.Persistence;

public sealed class AccountsDbContext(DbContextOptions<AccountsDbContext> options) : DbContext(options), IAccountsDbContext
{
    public DbSet<ChartOfAccount> ChartOfAccounts => Set<ChartOfAccount>();
    public DbSet<FiscalYear> FiscalYears => Set<FiscalYear>();
    public DbSet<AccountingPeriod> AccountingPeriods => Set<AccountingPeriod>();
    public DbSet<CostCenter> CostCenters => Set<CostCenter>();
    public DbSet<Voucher> Vouchers => Set<Voucher>();
    public DbSet<VoucherLine> VoucherLines => Set<VoucherLine>();
    public DbSet<GeneralLedgerEntry> GeneralLedgerEntries => Set<GeneralLedgerEntry>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<CashReceipt> CashReceipts => Set<CashReceipt>();
    public DbSet<MoneyReceipt> MoneyReceipts => Set<MoneyReceipt>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<DailyExpense> DailyExpenses => Set<DailyExpense>();
    public DbSet<MoneyRequest> MoneyRequests => Set<MoneyRequest>();
    public DbSet<AdvancePayment> AdvancePayments => Set<AdvancePayment>();
    public DbSet<AdvanceSalaryPayment> AdvanceSalaryPayments => Set<AdvanceSalaryPayment>();
    public DbSet<CompanyMoneyTransfer> CompanyMoneyTransfers => Set<CompanyMoneyTransfer>();
    public DbSet<SupplierPayable> SupplierPayables => Set<SupplierPayable>();
    public DbSet<CustomerReceivable> CustomerReceivables => Set<CustomerReceivable>();
    public DbSet<AccountsAuditLog> AuditLogs => Set<AccountsAuditLog>();

    IQueryable<ChartOfAccount> IAccountsDbContext.ChartOfAccounts => ChartOfAccounts;
    IQueryable<FiscalYear> IAccountsDbContext.FiscalYears => FiscalYears;
    IQueryable<AccountingPeriod> IAccountsDbContext.AccountingPeriods => AccountingPeriods;
    IQueryable<CostCenter> IAccountsDbContext.CostCenters => CostCenters;
    IQueryable<Voucher> IAccountsDbContext.Vouchers => Vouchers;
    IQueryable<VoucherLine> IAccountsDbContext.VoucherLines => VoucherLines;
    IQueryable<GeneralLedgerEntry> IAccountsDbContext.GeneralLedgerEntries => GeneralLedgerEntries;
    IQueryable<BankAccount> IAccountsDbContext.BankAccounts => BankAccounts;
    IQueryable<CashReceipt> IAccountsDbContext.CashReceipts => CashReceipts;
    IQueryable<MoneyReceipt> IAccountsDbContext.MoneyReceipts => MoneyReceipts;
    IQueryable<ExpenseCategory> IAccountsDbContext.ExpenseCategories => ExpenseCategories;
    IQueryable<DailyExpense> IAccountsDbContext.DailyExpenses => DailyExpenses;
    IQueryable<MoneyRequest> IAccountsDbContext.MoneyRequests => MoneyRequests;
    IQueryable<AdvancePayment> IAccountsDbContext.AdvancePayments => AdvancePayments;
    IQueryable<AdvanceSalaryPayment> IAccountsDbContext.AdvanceSalaryPayments => AdvanceSalaryPayments;
    IQueryable<CompanyMoneyTransfer> IAccountsDbContext.CompanyMoneyTransfers => CompanyMoneyTransfers;
    IQueryable<SupplierPayable> IAccountsDbContext.SupplierPayables => SupplierPayables;
    IQueryable<CustomerReceivable> IAccountsDbContext.CustomerReceivables => CustomerReceivables;
    IQueryable<AccountsAuditLog> IAccountsDbContext.AuditLogs => AuditLogs;

    void IAccountsDbContext.Add<TEntity>(TEntity entity) => Set<TEntity>().Add(entity);
    void IAccountsDbContext.Remove<TEntity>(TEntity entity) => Set<TEntity>().Remove(entity);

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        AddAuditEntries();
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ConfigureAuditable<ChartOfAccount>(modelBuilder);
        ConfigureAuditable<FiscalYear>(modelBuilder);
        ConfigureAuditable<AccountingPeriod>(modelBuilder);
        ConfigureAuditable<CostCenter>(modelBuilder);
        ConfigureAuditable<Voucher>(modelBuilder);
        ConfigureAuditable<VoucherLine>(modelBuilder);
        ConfigureAuditable<BankAccount>(modelBuilder);
        ConfigureAuditable<CashReceipt>(modelBuilder);
        ConfigureAuditable<MoneyReceipt>(modelBuilder);
        ConfigureAuditable<ExpenseCategory>(modelBuilder);
        ConfigureAuditable<DailyExpense>(modelBuilder);
        ConfigureAuditable<MoneyRequest>(modelBuilder);
        ConfigureAuditable<AdvancePayment>(modelBuilder);
        ConfigureAuditable<AdvanceSalaryPayment>(modelBuilder);
        ConfigureAuditable<CompanyMoneyTransfer>(modelBuilder);
        ConfigureAuditable<SupplierPayable>(modelBuilder);
        ConfigureAuditable<CustomerReceivable>(modelBuilder);

        modelBuilder.Entity<ChartOfAccount>(e =>
        {
            e.ToTable("ChartOfAccounts");
            e.Property(x => x.AccountCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.AccountName).HasMaxLength(200).IsRequired();
            e.Property(x => x.AccountType).HasMaxLength(50).IsRequired();
            e.Property(x => x.NormalBalance).HasMaxLength(20).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.AccountCode }).IsUnique();
            e.HasOne(x => x.ParentAccount).WithMany(x => x.Children).HasForeignKey(x => x.ParentAccountId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FiscalYear>(e =>
        {
            e.ToTable("FiscalYears");
            e.Property(x => x.YearName).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.YearName }).IsUnique();
        });

        modelBuilder.Entity<AccountingPeriod>(e =>
        {
            e.ToTable("AccountingPeriods");
            e.Property(x => x.PeriodName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.FiscalYear).WithMany(x => x.AccountingPeriods).HasForeignKey(x => x.FiscalYearId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.CompanyId, x.FiscalYearId, x.PeriodName }).IsUnique();
        });

        modelBuilder.Entity<CostCenter>(e =>
        {
            e.ToTable("CostCenters");
            e.Property(x => x.CostCenterCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.CostCenterName).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.CostCenterCode }).IsUnique();
        });

        modelBuilder.Entity<Voucher>(e =>
        {
            e.ToTable("Vouchers");
            e.Property(x => x.VoucherNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.VoucherType).HasMaxLength(50).IsRequired();
            e.Property(x => x.ReferenceNo).HasMaxLength(100);
            e.Property(x => x.Narration).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(VoucherStatuses.Draft);
            e.Property(x => x.TotalDebit).HasPrecision(18, 2);
            e.Property(x => x.TotalCredit).HasPrecision(18, 2);
            e.HasIndex(x => new { x.CompanyId, x.VoucherNo }).IsUnique();
        });

        modelBuilder.Entity<VoucherLine>(e =>
        {
            e.ToTable("VoucherLines");
            e.Property(x => x.DebitAmount).HasPrecision(18, 2);
            e.Property(x => x.CreditAmount).HasPrecision(18, 2);
            e.Property(x => x.Description).HasMaxLength(300);
            e.HasOne(x => x.Voucher).WithMany(x => x.Lines).HasForeignKey(x => x.VoucherId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CostCenter).WithMany().HasForeignKey(x => x.CostCenterId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GeneralLedgerEntry>(e =>
        {
            e.ToTable("GeneralLedgerEntries");
            e.HasKey(x => x.Id);
            e.Property(x => x.DebitAmount).HasPrecision(18, 2);
            e.Property(x => x.CreditAmount).HasPrecision(18, 2);
            e.Property(x => x.BalanceAmount).HasPrecision(18, 2);
            e.Property(x => x.ReferenceNo).HasMaxLength(100);
            e.HasIndex(x => new { x.CompanyId, x.AccountId, x.TransactionDate });
            e.HasIndex(x => new { x.CompanyId, x.VoucherId });
        });

        modelBuilder.Entity<BankAccount>(e =>
        {
            e.ToTable("BankAccounts");
            e.Property(x => x.BankName).HasMaxLength(150).IsRequired();
            e.Property(x => x.BranchName).HasMaxLength(150);
            e.Property(x => x.AccountNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.RoutingNo).HasMaxLength(100);
            e.HasIndex(x => new { x.CompanyId, x.AccountNo }).IsUnique();
        });

        ConfigureReceipt(modelBuilder);
        ConfigureExpensesAndRequests(modelBuilder);
        ConfigurePayables(modelBuilder);
        ConfigureAudit(modelBuilder);
        Seed(modelBuilder);
    }

    private static void ConfigureReceipt(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CashReceipt>(e =>
        {
            e.ToTable("CashReceipts");
            e.Property(x => x.ReceiptNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.ReceivedFromType).HasMaxLength(50).IsRequired();
            e.Property(x => x.PaymentMethod).HasMaxLength(50).IsRequired();
            e.Property(x => x.ReferenceNo).HasMaxLength(100);
            e.Property(x => x.Purpose).HasMaxLength(300);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Draft);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.CompanyId, x.ReceiptNo }).IsUnique();
        });
        modelBuilder.Entity<MoneyReceipt>(e =>
        {
            e.ToTable("MoneyReceipts");
            e.Property(x => x.MoneyReceiptNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.ReceivedFrom).HasMaxLength(200).IsRequired();
            e.Property(x => x.ReceivedFromType).HasMaxLength(50).IsRequired();
            e.Property(x => x.PaymentMethod).HasMaxLength(50).IsRequired();
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Draft);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.CompanyId, x.MoneyReceiptNo }).IsUnique();
        });
    }

    private static void ConfigureExpensesAndRequests(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ExpenseCategory>(e =>
        {
            e.ToTable("ExpenseCategories");
            e.Property(x => x.CategoryCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.CategoryName).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.CategoryCode }).IsUnique();
        });
        modelBuilder.Entity<DailyExpense>(e =>
        {
            e.ToTable("DailyExpenses");
            e.Property(x => x.ExpenseNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.PaymentMethod).HasMaxLength(50).IsRequired();
            e.Property(x => x.PaidTo).HasMaxLength(150);
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Pending);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.CompanyId, x.ExpenseNo }).IsUnique();
        });
        modelBuilder.Entity<MoneyRequest>(e =>
        {
            e.ToTable("MoneyRequests");
            e.Property(x => x.RequestNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Purpose).HasMaxLength(500).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Pending);
            e.Property(x => x.RequestedAmount).HasPrecision(18, 2);
            e.Property(x => x.ApprovedAmount).HasPrecision(18, 2);
            e.Property(x => x.PaidAmount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.CompanyId, x.RequestNo }).IsUnique();
        });
        modelBuilder.Entity<AdvancePayment>(e =>
        {
            e.ToTable("AdvancePayments");
            e.Property(x => x.AdvanceNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.AdvanceType).HasMaxLength(50).IsRequired();
            e.Property(x => x.PaidToType).HasMaxLength(50).IsRequired();
            e.Property(x => x.PaidToName).HasMaxLength(150);
            e.Property(x => x.Purpose).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Pending);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.CompanyId, x.AdvanceNo }).IsUnique();
        });
        modelBuilder.Entity<AdvanceSalaryPayment>(e =>
        {
            e.ToTable("AdvanceSalaryPayments");
            e.Property(x => x.AdvanceSalaryNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Pending);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.InstallmentAmount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.CompanyId, x.AdvanceSalaryNo }).IsUnique();
        });
        modelBuilder.Entity<CompanyMoneyTransfer>(e =>
        {
            e.ToTable("CompanyMoneyTransfers");
            e.Property(x => x.TransferNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.TransferMethod).HasMaxLength(50).IsRequired();
            e.Property(x => x.ReferenceNo).HasMaxLength(100);
            e.Property(x => x.Purpose).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Pending);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.FromCompanyId, x.TransferNo }).IsUnique();
        });
    }

    private static void ConfigurePayables(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SupplierPayable>(e =>
        {
            e.ToTable("SupplierPayables");
            e.Property(x => x.InvoiceNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Open);
            e.Property(x => x.InvoiceAmount).HasPrecision(18, 2);
            e.Property(x => x.PaidAmount).HasPrecision(18, 2);
            e.Property(x => x.BalanceAmount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.CompanyId, x.SupplierId, x.InvoiceNo }).IsUnique();
        });
        modelBuilder.Entity<CustomerReceivable>(e =>
        {
            e.ToTable("CustomerReceivables");
            e.Property(x => x.InvoiceNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Open);
            e.Property(x => x.InvoiceAmount).HasPrecision(18, 2);
            e.Property(x => x.ReceivedAmount).HasPrecision(18, 2);
            e.Property(x => x.BalanceAmount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.CompanyId, x.BuyerId, x.InvoiceNo }).IsUnique();
        });
    }

    private static void ConfigureAudit(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AccountsAuditLog>(e =>
        {
            e.ToTable("AccountsAuditLogs");
            e.HasKey(x => x.Id);
            e.Property(x => x.EntityName).HasMaxLength(120).IsRequired();
            e.Property(x => x.Action).HasMaxLength(50).IsRequired();
            e.Property(x => x.Remarks).HasMaxLength(500);
            e.HasIndex(x => new { x.CompanyId, x.EntityName, x.EntityId, x.CreatedAt });
        });
    }

    private void AddAuditEntries()
    {
        foreach (var entry in ChangeTracker.Entries<AccountsService.Domain.AuditableEntity>().Where(x => x.State is EntityState.Added or EntityState.Modified or EntityState.Deleted))
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = BusinessTime.Now;
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = BusinessTime.Now;
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.UpdatedAt = BusinessTime.Now;
            }
        }
    }

    private static void ConfigureAuditable<TEntity>(ModelBuilder modelBuilder) where TEntity : AccountsService.Domain.AuditableEntity
    {
        modelBuilder.Entity<TEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.CompanyId).IsRequired();
            e.Property(x => x.RowVersion).IsRowVersion();
            e.HasIndex(x => x.CompanyId);
        });
    }

    private static void Seed(ModelBuilder modelBuilder)
    {
        var companyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var createdAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var accounts = new[]
        {
            SeedAccount("10000000-0000-0000-0000-000000001100", companyId, "1100", "Cash in Hand", AccountTypes.Asset, NormalBalances.Debit, isCash: true),
            SeedAccount("10000000-0000-0000-0000-000000001120", companyId, "1120", "Bank Account", AccountTypes.Asset, NormalBalances.Debit, isBank: true),
            SeedAccount("10000000-0000-0000-0000-000000001300", companyId, "1300", "Employee/Supplier Advances", AccountTypes.Asset, NormalBalances.Debit),
            SeedAccount("10000000-0000-0000-0000-000000001310", companyId, "1310", "Advance Salary", AccountTypes.Asset, NormalBalances.Debit),
            SeedAccount("10000000-0000-0000-0000-000000001400", companyId, "1400", "InterCompany Transfer Receivable", AccountTypes.Asset, NormalBalances.Debit),
            SeedAccount("10000000-0000-0000-0000-000000002100", companyId, "2100", "InterCompany Transfer Payable", AccountTypes.Liability, NormalBalances.Credit),
            SeedAccount("10000000-0000-0000-0000-000000004100", companyId, "4100", "Other Income", AccountTypes.Income, NormalBalances.Credit),
            SeedAccount("10000000-0000-0000-0000-000000005100", companyId, "5100", "Office Expense", AccountTypes.Expense, NormalBalances.Debit),
            SeedAccount("10000000-0000-0000-0000-000000005300", companyId, "5300", "Approved Money Request Expense", AccountTypes.Expense, NormalBalances.Debit),
        };
        foreach (var account in accounts)
        {
            account.CreatedAt = createdAt;
        }
        modelBuilder.Entity<ChartOfAccount>().HasData(accounts);
        modelBuilder.Entity<ExpenseCategory>().HasData(new ExpenseCategory
        {
            Id = Guid.Parse("12000000-0000-0000-0000-000000000001"),
            CompanyId = companyId,
            CategoryCode = "OFFICE",
            CategoryName = "Office Expense",
            ExpenseAccountId = Guid.Parse("10000000-0000-0000-0000-000000005100"),
            CreatedAt = createdAt,
        });
    }

    private static ChartOfAccount SeedAccount(string id, Guid companyId, string code, string name, string type, string normalBalance, bool isCash = false, bool isBank = false) =>
        new()
        {
            Id = Guid.Parse(id),
            CompanyId = companyId,
            AccountCode = code,
            AccountName = name,
            AccountType = type,
            NormalBalance = normalBalance,
            IsCashAccount = isCash,
            IsBankAccount = isBank,
            IsActive = true,
        };
}
