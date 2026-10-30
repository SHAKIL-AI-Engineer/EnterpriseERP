using AccountsService.Contracts;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AccountsService.Application.Handlers;

public sealed class QueryHandlers(IUnitOfWork uow, IAccountsDbContext db, IMapper mapper, IRedisCacheService cache, IReportService reports) :
    IRequestHandler<GetChartOfAccountsQuery, IReadOnlyList<ChartOfAccountDto>>,
    IRequestHandler<GetChartOfAccountByIdQuery, ChartOfAccountDto>,
    IRequestHandler<GetFiscalYearsQuery, IReadOnlyList<FiscalYearDto>>,
    IRequestHandler<GetVouchersQuery, IReadOnlyList<VoucherDto>>,
    IRequestHandler<GetVoucherByIdQuery, VoucherDto>,
    IRequestHandler<GetGeneralLedgerQuery, IReadOnlyList<GeneralLedgerEntryDto>>,
    IRequestHandler<GetCashBookQuery, IReadOnlyList<GeneralLedgerEntryDto>>,
    IRequestHandler<GetBankBookQuery, IReadOnlyList<GeneralLedgerEntryDto>>,
    IRequestHandler<GetDailyExpenseReportQuery, FinancialStatementDto>,
    IRequestHandler<GetMonthlyExpenseReportQuery, FinancialStatementDto>,
    IRequestHandler<GetTrialBalanceQuery, FinancialStatementDto>,
    IRequestHandler<GetProfitLossQuery, FinancialStatementDto>,
    IRequestHandler<GetBalanceSheetQuery, FinancialStatementDto>,
    IRequestHandler<GetCashFlowQuery, FinancialStatementDto>,
    IRequestHandler<GetCashReceiptsQuery, IReadOnlyList<CashReceiptDto>>,
    IRequestHandler<GetCashReceiptByIdQuery, CashReceiptDto>,
    IRequestHandler<GetMoneyReceiptsQuery, IReadOnlyList<MoneyReceiptDto>>,
    IRequestHandler<GetMoneyReceiptByIdQuery, MoneyReceiptDto>,
    IRequestHandler<GetDailyExpensesQuery, IReadOnlyList<DailyExpenseDto>>,
    IRequestHandler<GetDailyExpenseByIdQuery, DailyExpenseDto>,
    IRequestHandler<GetMoneyRequestsQuery, IReadOnlyList<MoneyRequestDto>>,
    IRequestHandler<GetMoneyRequestByIdQuery, MoneyRequestDto>,
    IRequestHandler<GetAdvancePaymentsQuery, IReadOnlyList<AdvancePaymentDto>>,
    IRequestHandler<GetAdvancePaymentByIdQuery, AdvancePaymentDto>,
    IRequestHandler<GetAdvanceSalaryPaymentsQuery, IReadOnlyList<AdvanceSalaryPaymentDto>>,
    IRequestHandler<GetAdvanceSalaryPaymentByIdQuery, AdvanceSalaryPaymentDto>,
    IRequestHandler<GetCompanyMoneyTransfersQuery, IReadOnlyList<CompanyMoneyTransferDto>>,
    IRequestHandler<GetCompanyMoneyTransferByIdQuery, CompanyMoneyTransferDto>
{
    public async Task<IReadOnlyList<ChartOfAccountDto>> Handle(GetChartOfAccountsQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.Coa(query.CompanyId);
        var cached = await cache.GetAsync<IReadOnlyList<ChartOfAccountDto>>(key, cancellationToken);
        if (cached is not null) return cached;
        var accounts = await uow.ChartOfAccounts.Query().Where(x => x.CompanyId == query.CompanyId && !x.IsDeleted).OrderBy(x => x.AccountCode).ToListAsync(cancellationToken);
        var result = mapper.Map<IReadOnlyList<ChartOfAccountDto>>(accounts);
        await cache.SetAsync(key, result, TimeSpan.FromHours(6), cancellationToken);
        return result;
    }

    public async Task<ChartOfAccountDto> Handle(GetChartOfAccountByIdQuery query, CancellationToken cancellationToken) =>
        mapper.Map<ChartOfAccountDto>(await uow.ChartOfAccounts.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Account not found."));

    public async Task<IReadOnlyList<FiscalYearDto>> Handle(GetFiscalYearsQuery query, CancellationToken cancellationToken) =>
        mapper.Map<IReadOnlyList<FiscalYearDto>>(await uow.FiscalYears.Query().Where(x => x.CompanyId == query.CompanyId).OrderByDescending(x => x.StartDate).ToListAsync(cancellationToken));

    public async Task<IReadOnlyList<VoucherDto>> Handle(GetVouchersQuery query, CancellationToken cancellationToken)
    {
        var vouchers = db.Vouchers.Include(x => x.Lines).Where(x => x.CompanyId == query.CompanyId && !x.IsDeleted);
        if (query.FromDate.HasValue) vouchers = vouchers.Where(x => x.VoucherDate >= query.FromDate.Value);
        if (query.ToDate.HasValue) vouchers = vouchers.Where(x => x.VoucherDate <= query.ToDate.Value);
        if (!string.IsNullOrWhiteSpace(query.Type)) vouchers = vouchers.Where(x => x.VoucherType == query.Type);
        return mapper.Map<IReadOnlyList<VoucherDto>>(await vouchers.OrderByDescending(x => x.VoucherDate).ToListAsync(cancellationToken));
    }

    public async Task<VoucherDto> Handle(GetVoucherByIdQuery query, CancellationToken cancellationToken) =>
        mapper.Map<VoucherDto>(await db.Vouchers.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == query.Id && !x.IsDeleted, cancellationToken) ?? throw new KeyNotFoundException("Voucher not found."));

    public Task<IReadOnlyList<GeneralLedgerEntryDto>> Handle(GetGeneralLedgerQuery query, CancellationToken cancellationToken) => reports.GetLedgerAsync(query.CompanyId, query.AccountId, query.FromDate, query.ToDate, cancellationToken);
    public Task<IReadOnlyList<GeneralLedgerEntryDto>> Handle(GetCashBookQuery query, CancellationToken cancellationToken) => reports.GetCashBookAsync(query.CompanyId, query.FromDate, query.ToDate, cancellationToken);
    public Task<IReadOnlyList<GeneralLedgerEntryDto>> Handle(GetBankBookQuery query, CancellationToken cancellationToken) => reports.GetBankBookAsync(query.CompanyId, query.FromDate, query.ToDate, cancellationToken);
    public Task<FinancialStatementDto> Handle(GetDailyExpenseReportQuery query, CancellationToken cancellationToken) => reports.GetProfitLossAsync(query.CompanyId, query.Date, query.Date, cancellationToken);
    public Task<FinancialStatementDto> Handle(GetMonthlyExpenseReportQuery query, CancellationToken cancellationToken) => reports.GetProfitLossAsync(query.CompanyId, new DateOnly(query.Year, query.Month, 1), new DateOnly(query.Year, query.Month, DateTime.DaysInMonth(query.Year, query.Month)), cancellationToken);
    public Task<FinancialStatementDto> Handle(GetTrialBalanceQuery query, CancellationToken cancellationToken) => reports.GetTrialBalanceAsync(query.CompanyId, query.FromDate, query.ToDate, cancellationToken);
    public Task<FinancialStatementDto> Handle(GetProfitLossQuery query, CancellationToken cancellationToken) => reports.GetProfitLossAsync(query.CompanyId, query.FromDate, query.ToDate, cancellationToken);
    public Task<FinancialStatementDto> Handle(GetBalanceSheetQuery query, CancellationToken cancellationToken) => reports.GetBalanceSheetAsync(query.CompanyId, query.AsOfDate, cancellationToken);
    public Task<FinancialStatementDto> Handle(GetCashFlowQuery query, CancellationToken cancellationToken) => reports.GetCashFlowAsync(query.CompanyId, query.FromDate, query.ToDate, cancellationToken);

    public async Task<IReadOnlyList<CashReceiptDto>> Handle(GetCashReceiptsQuery query, CancellationToken cancellationToken)
    {
        var rows = db.CashReceipts.Where(x => x.CompanyId == query.CompanyId);
        if (query.FromDate.HasValue) rows = rows.Where(x => x.ReceiptDate >= query.FromDate.Value);
        if (query.ToDate.HasValue) rows = rows.Where(x => x.ReceiptDate <= query.ToDate.Value);
        return mapper.Map<IReadOnlyList<CashReceiptDto>>(await rows.OrderByDescending(x => x.ReceiptDate).ToListAsync(cancellationToken));
    }
    public async Task<CashReceiptDto> Handle(GetCashReceiptByIdQuery query, CancellationToken cancellationToken) => mapper.Map<CashReceiptDto>(await uow.CashReceipts.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Cash receipt not found."));
    public async Task<IReadOnlyList<MoneyReceiptDto>> Handle(GetMoneyReceiptsQuery query, CancellationToken cancellationToken)
    {
        var rows = db.MoneyReceipts.Where(x => x.CompanyId == query.CompanyId);
        if (query.FromDate.HasValue) rows = rows.Where(x => x.ReceiptDate >= query.FromDate.Value);
        if (query.ToDate.HasValue) rows = rows.Where(x => x.ReceiptDate <= query.ToDate.Value);
        return mapper.Map<IReadOnlyList<MoneyReceiptDto>>(await rows.OrderByDescending(x => x.ReceiptDate).ToListAsync(cancellationToken));
    }
    public async Task<MoneyReceiptDto> Handle(GetMoneyReceiptByIdQuery query, CancellationToken cancellationToken) => mapper.Map<MoneyReceiptDto>(await uow.MoneyReceipts.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Money receipt not found."));
    public async Task<IReadOnlyList<DailyExpenseDto>> Handle(GetDailyExpensesQuery query, CancellationToken cancellationToken)
    {
        var rows = db.DailyExpenses.Where(x => x.CompanyId == query.CompanyId);
        if (query.FromDate.HasValue) rows = rows.Where(x => x.ExpenseDate >= query.FromDate.Value);
        if (query.ToDate.HasValue) rows = rows.Where(x => x.ExpenseDate <= query.ToDate.Value);
        return mapper.Map<IReadOnlyList<DailyExpenseDto>>(await rows.OrderByDescending(x => x.ExpenseDate).ToListAsync(cancellationToken));
    }
    public async Task<DailyExpenseDto> Handle(GetDailyExpenseByIdQuery query, CancellationToken cancellationToken) => mapper.Map<DailyExpenseDto>(await uow.DailyExpenses.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Daily expense not found."));
    public async Task<IReadOnlyList<MoneyRequestDto>> Handle(GetMoneyRequestsQuery query, CancellationToken cancellationToken)
    {
        var rows = db.MoneyRequests.Where(x => x.CompanyId == query.CompanyId);
        if (!string.IsNullOrWhiteSpace(query.Status)) rows = rows.Where(x => x.Status == query.Status);
        return mapper.Map<IReadOnlyList<MoneyRequestDto>>(await rows.OrderByDescending(x => x.RequestDate).ToListAsync(cancellationToken));
    }
    public async Task<MoneyRequestDto> Handle(GetMoneyRequestByIdQuery query, CancellationToken cancellationToken) => mapper.Map<MoneyRequestDto>(await uow.MoneyRequests.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Money request not found."));
    public async Task<IReadOnlyList<AdvancePaymentDto>> Handle(GetAdvancePaymentsQuery query, CancellationToken cancellationToken)
    {
        var rows = db.AdvancePayments.Where(x => x.CompanyId == query.CompanyId);
        if (query.FromDate.HasValue) rows = rows.Where(x => x.AdvanceDate >= query.FromDate.Value);
        if (query.ToDate.HasValue) rows = rows.Where(x => x.AdvanceDate <= query.ToDate.Value);
        return mapper.Map<IReadOnlyList<AdvancePaymentDto>>(await rows.OrderByDescending(x => x.AdvanceDate).ToListAsync(cancellationToken));
    }
    public async Task<AdvancePaymentDto> Handle(GetAdvancePaymentByIdQuery query, CancellationToken cancellationToken) => mapper.Map<AdvancePaymentDto>(await uow.AdvancePayments.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Advance payment not found."));
    public async Task<IReadOnlyList<AdvanceSalaryPaymentDto>> Handle(GetAdvanceSalaryPaymentsQuery query, CancellationToken cancellationToken)
    {
        var rows = db.AdvanceSalaryPayments.Where(x => x.CompanyId == query.CompanyId);
        if (query.EmployeeId.HasValue) rows = rows.Where(x => x.EmployeeId == query.EmployeeId.Value);
        return mapper.Map<IReadOnlyList<AdvanceSalaryPaymentDto>>(await rows.OrderByDescending(x => x.AdvanceDate).ToListAsync(cancellationToken));
    }
    public async Task<AdvanceSalaryPaymentDto> Handle(GetAdvanceSalaryPaymentByIdQuery query, CancellationToken cancellationToken) => mapper.Map<AdvanceSalaryPaymentDto>(await uow.AdvanceSalaryPayments.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Advance salary payment not found."));
    public async Task<IReadOnlyList<CompanyMoneyTransferDto>> Handle(GetCompanyMoneyTransfersQuery query, CancellationToken cancellationToken)
    {
        var rows = db.CompanyMoneyTransfers.AsQueryable();
        if (query.FromCompanyId.HasValue) rows = rows.Where(x => x.FromCompanyId == query.FromCompanyId.Value);
        if (query.ToCompanyId.HasValue) rows = rows.Where(x => x.ToCompanyId == query.ToCompanyId.Value);
        return mapper.Map<IReadOnlyList<CompanyMoneyTransferDto>>(await rows.OrderByDescending(x => x.TransferDate).ToListAsync(cancellationToken));
    }
    public async Task<CompanyMoneyTransferDto> Handle(GetCompanyMoneyTransferByIdQuery query, CancellationToken cancellationToken) => mapper.Map<CompanyMoneyTransferDto>(await uow.CompanyMoneyTransfers.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Company money transfer not found."));
}
