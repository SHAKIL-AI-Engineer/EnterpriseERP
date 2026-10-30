using AccountsService.Contracts;
using AccountsService.Domain;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace AccountsService.Application.Services;

public sealed class VoucherPostingService(IAccountsDbContext db, IIntegrationEventPublisher publisher) : IVoucherPostingService
{
    public Voucher BuildVoucher(Guid companyId, string voucherNo, DateOnly date, string type, string? referenceNo, string? narration, Guid? createdBy, params VoucherLineDraft[] lines)
    {
        var voucher = new Voucher
        {
            CompanyId = companyId,
            VoucherNo = voucherNo,
            VoucherDate = date,
            VoucherType = type,
            ReferenceNo = referenceNo,
            Narration = narration,
            CreatedBy = createdBy,
            Lines = lines.Select(x => new VoucherLine
            {
                CompanyId = companyId,
                AccountId = x.AccountId,
                CostCenterId = x.CostCenterId,
                DebitAmount = x.DebitAmount,
                CreditAmount = x.CreditAmount,
                Description = x.Description,
            }).ToList(),
        };
        voucher.TotalDebit = voucher.Lines.Sum(x => x.DebitAmount);
        voucher.TotalCredit = voucher.Lines.Sum(x => x.CreditAmount);
        return voucher;
    }

    public async Task ValidateBalancedAndOpenPeriodAsync(Voucher voucher, CancellationToken cancellationToken = default)
    {
        if (voucher.Lines.Count < 2)
        {
            throw new InvalidOperationException("Voucher must have at least two lines.");
        }

        voucher.TotalDebit = voucher.Lines.Sum(x => x.DebitAmount);
        voucher.TotalCredit = voucher.Lines.Sum(x => x.CreditAmount);
        if (voucher.TotalDebit <= 0 || voucher.TotalDebit != voucher.TotalCredit)
        {
            throw new InvalidOperationException("Voucher total debit must equal total credit.");
        }

        var periodClosed = await db.AccountingPeriods.AnyAsync(x =>
            x.CompanyId == voucher.CompanyId &&
            x.StartDate <= voucher.VoucherDate &&
            x.EndDate >= voucher.VoucherDate &&
            x.IsClosed, cancellationToken);

        if (periodClosed)
        {
            throw new InvalidOperationException("Closed accounting period cannot accept transactions.");
        }
    }

    public async Task PostAsync(Voucher voucher, Guid? postedBy, CancellationToken cancellationToken = default)
    {
        if (voucher.Status == VoucherStatuses.Posted)
        {
            return;
        }

        if (voucher.Status is VoucherStatuses.Cancelled)
        {
            throw new InvalidOperationException("Cancelled voucher cannot be posted.");
        }

        await ValidateBalancedAndOpenPeriodAsync(voucher, cancellationToken);
        foreach (var line in voucher.Lines)
        {
            var previousBalance = await db.GeneralLedgerEntries
                .Where(x => x.CompanyId == voucher.CompanyId && x.AccountId == line.AccountId)
                .OrderByDescending(x => x.TransactionDate)
                .ThenByDescending(x => x.CreatedAt)
                .Select(x => (decimal?)x.BalanceAmount)
                .FirstOrDefaultAsync(cancellationToken) ?? 0m;

            db.Add(new GeneralLedgerEntry
            {
                CompanyId = voucher.CompanyId,
                VoucherId = voucher.Id,
                VoucherLineId = line.Id,
                AccountId = line.AccountId,
                CostCenterId = line.CostCenterId,
                TransactionDate = voucher.VoucherDate,
                DebitAmount = line.DebitAmount,
                CreditAmount = line.CreditAmount,
                BalanceAmount = previousBalance + line.DebitAmount - line.CreditAmount,
                ReferenceNo = voucher.ReferenceNo,
            });
        }

        voucher.Status = VoucherStatuses.Posted;
        voucher.PostedBy = postedBy;
        voucher.PostedAt = BusinessTime.Now;
        db.Add(new AccountsAuditLog { CompanyId = voucher.CompanyId, EntityName = nameof(Voucher), EntityId = voucher.Id, Action = "Posted", UserId = postedBy });
        await db.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new VoucherPosted(voucher.CompanyId, voucher.Id, voucher.VoucherNo, voucher.VoucherDate, voucher.TotalDebit, voucher.TotalCredit), cancellationToken);
    }
}

public sealed class ReportService(IAccountsDbContext db) : IReportService
{
    public async Task<IReadOnlyList<GeneralLedgerEntryDto>> GetLedgerAsync(Guid companyId, Guid? accountId, DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default)
    {
        var query = db.GeneralLedgerEntries.Where(x => x.CompanyId == companyId);
        if (accountId.HasValue) query = query.Where(x => x.AccountId == accountId.Value);
        if (fromDate.HasValue) query = query.Where(x => x.TransactionDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(x => x.TransactionDate <= toDate.Value);
        return await query.OrderBy(x => x.TransactionDate).ThenBy(x => x.CreatedAt)
            .Select(x => new GeneralLedgerEntryDto(x.Id, x.CompanyId, x.VoucherId, x.VoucherLineId, x.AccountId, x.CostCenterId, x.TransactionDate, x.DebitAmount, x.CreditAmount, x.BalanceAmount, x.ReferenceNo))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<GeneralLedgerEntryDto>> GetCashBookAsync(Guid companyId, DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default)
    {
        var accounts = await db.ChartOfAccounts.Where(x => x.CompanyId == companyId && x.IsCashAccount).Select(x => x.Id).ToListAsync(cancellationToken);
        return (await GetLedgerAsync(companyId, null, fromDate, toDate, cancellationToken)).Where(x => accounts.Contains(x.AccountId)).ToList();
    }

    public async Task<IReadOnlyList<GeneralLedgerEntryDto>> GetBankBookAsync(Guid companyId, DateOnly? fromDate, DateOnly? toDate, CancellationToken cancellationToken = default)
    {
        var accounts = await db.ChartOfAccounts.Where(x => x.CompanyId == companyId && x.IsBankAccount).Select(x => x.Id).ToListAsync(cancellationToken);
        return (await GetLedgerAsync(companyId, null, fromDate, toDate, cancellationToken)).Where(x => accounts.Contains(x.AccountId)).ToList();
    }

    public Task<FinancialStatementDto> GetTrialBalanceAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default) =>
        BuildStatementAsync(companyId, fromDate, toDate, null, cancellationToken);

    public Task<FinancialStatementDto> GetProfitLossAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default) =>
        BuildStatementAsync(companyId, fromDate, toDate, [AccountTypes.Income, AccountTypes.Expense], cancellationToken);

    public Task<FinancialStatementDto> GetBalanceSheetAsync(Guid companyId, DateOnly asOfDate, CancellationToken cancellationToken = default) =>
        BuildStatementAsync(companyId, DateOnly.MinValue, asOfDate, [AccountTypes.Asset, AccountTypes.Liability, AccountTypes.Equity], cancellationToken);

    public async Task<FinancialStatementDto> GetCashFlowAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default)
    {
        var entries = await GetCashBookAsync(companyId, fromDate, toDate, cancellationToken);
        var line = new FinancialReportLineDto("CASH", "Net cash movement", entries.Sum(x => x.DebitAmount), entries.Sum(x => x.CreditAmount), entries.Sum(x => x.DebitAmount - x.CreditAmount));
        return new FinancialStatementDto(companyId, fromDate, toDate, [line], line.Debit, line.Credit, line.Balance);
    }

    private async Task<FinancialStatementDto> BuildStatementAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, string[]? accountTypes, CancellationToken cancellationToken)
    {
        var query =
            from gl in db.GeneralLedgerEntries
            join account in db.ChartOfAccounts on gl.AccountId equals account.Id
            where gl.CompanyId == companyId && gl.TransactionDate >= fromDate && gl.TransactionDate <= toDate
            select new { gl, account };

        if (accountTypes is not null)
        {
            query = query.Where(x => accountTypes.Contains(x.account.AccountType));
        }

        var lines = await query
            .GroupBy(x => new { x.account.AccountCode, x.account.AccountName })
            .Select(g => new FinancialReportLineDto(g.Key.AccountCode, g.Key.AccountName, g.Sum(x => x.gl.DebitAmount), g.Sum(x => x.gl.CreditAmount), g.Sum(x => x.gl.DebitAmount - x.gl.CreditAmount)))
            .OrderBy(x => x.Code)
            .ToListAsync(cancellationToken);

        return new FinancialStatementDto(companyId, fromDate, toDate, lines, lines.Sum(x => x.Debit), lines.Sum(x => x.Credit), lines.Sum(x => x.Balance));
    }
}
