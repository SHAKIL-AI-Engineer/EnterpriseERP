using AccountsService.Contracts;
using AccountsService.Domain;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace AccountsService.Application.Handlers;

public sealed class MasterDataCommandHandlers(IUnitOfWork uow, IAccountsDbContext db, IMapper mapper, IRedisCacheService cache) :
    IRequestHandler<CreateChartOfAccountCommand, ChartOfAccountDto>,
    IRequestHandler<UpdateChartOfAccountCommand, ChartOfAccountDto>,
    IRequestHandler<SetChartOfAccountActiveCommand, ChartOfAccountDto>,
    IRequestHandler<CreateFiscalYearCommand, FiscalYearDto>,
    IRequestHandler<CloseFiscalYearCommand, FiscalYearDto>
{
    public async Task<ChartOfAccountDto> Handle(CreateChartOfAccountCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.ChartOfAccounts.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.AccountCode == request.AccountCode && !x.IsDeleted, cancellationToken);
        if (exists) throw new InvalidOperationException("Account code already exists for this company.");
        var account = new ChartOfAccount
        {
            CompanyId = request.CompanyId,
            AccountCode = request.AccountCode.Trim(),
            AccountName = request.AccountName.Trim(),
            ParentAccountId = request.ParentAccountId,
            AccountType = request.AccountType,
            NormalBalance = request.NormalBalance,
            IsControlAccount = request.IsControlAccount,
            IsCashAccount = request.IsCashAccount,
            IsBankAccount = request.IsBankAccount,
            CreatedBy = request.CreatedBy,
        };
        await uow.ChartOfAccounts.AddAsync(account, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Coa(request.CompanyId), cancellationToken);
        return mapper.Map<ChartOfAccountDto>(account);
    }

    public async Task<ChartOfAccountDto> Handle(UpdateChartOfAccountCommand command, CancellationToken cancellationToken)
    {
        var account = await uow.ChartOfAccounts.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Account not found.");
        account.AccountName = command.Request.AccountName.Trim();
        account.ParentAccountId = command.Request.ParentAccountId;
        account.AccountType = command.Request.AccountType;
        account.NormalBalance = command.Request.NormalBalance;
        account.IsControlAccount = command.Request.IsControlAccount;
        account.IsCashAccount = command.Request.IsCashAccount;
        account.IsBankAccount = command.Request.IsBankAccount;
        account.IsActive = command.Request.IsActive;
        account.UpdatedBy = command.Request.UpdatedBy;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Coa(account.CompanyId), cancellationToken);
        return mapper.Map<ChartOfAccountDto>(account);
    }

    public async Task<ChartOfAccountDto> Handle(SetChartOfAccountActiveCommand command, CancellationToken cancellationToken)
    {
        var account = await uow.ChartOfAccounts.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Account not found.");
        account.IsActive = command.IsActive;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Coa(account.CompanyId), cancellationToken);
        return mapper.Map<ChartOfAccountDto>(account);
    }

    public async Task<FiscalYearDto> Handle(CreateFiscalYearCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var fiscalYear = new FiscalYear { CompanyId = request.CompanyId, YearName = request.YearName, StartDate = request.StartDate, EndDate = request.EndDate, CreatedBy = request.CreatedBy };
        await uow.FiscalYears.AddAsync(fiscalYear, cancellationToken);
        foreach (var month in Enumerable.Range(0, 12))
        {
            var start = request.StartDate.AddMonths(month);
            var end = start.AddMonths(1).AddDays(-1);
            if (end > request.EndDate) end = request.EndDate;
            db.Add(new AccountingPeriod { CompanyId = request.CompanyId, FiscalYearId = fiscalYear.Id, PeriodName = start.ToString("yyyy-MM"), StartDate = start, EndDate = end });
            if (end == request.EndDate) break;
        }
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<FiscalYearDto>(fiscalYear);
    }

    public async Task<FiscalYearDto> Handle(CloseFiscalYearCommand command, CancellationToken cancellationToken)
    {
        var fiscalYear = await uow.FiscalYears.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Fiscal year not found.");
        fiscalYear.IsClosed = true;
        fiscalYear.ClosedBy = command.ClosedBy;
        fiscalYear.ClosedAt = BusinessTime.Now;
        await db.AccountingPeriods.Where(x => x.FiscalYearId == fiscalYear.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsClosed, true).SetProperty(x => x.ClosedBy, command.ClosedBy).SetProperty(x => x.ClosedAt, BusinessTime.Now), cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<FiscalYearDto>(fiscalYear);
    }
}

public sealed class VoucherCommandHandlers(IUnitOfWork uow, IAccountsDbContext db, IMapper mapper, IVoucherPostingService posting, IRedisCacheService cache) :
    IRequestHandler<CreateVoucherCommand, VoucherDto>,
    IRequestHandler<SubmitVoucherCommand, VoucherDto>,
    IRequestHandler<ApproveVoucherCommand, VoucherDto>,
    IRequestHandler<PostVoucherCommand, VoucherDto>,
    IRequestHandler<CancelVoucherCommand, VoucherDto>
{
    public async Task<VoucherDto> Handle(CreateVoucherCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.Vouchers.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.VoucherNo == request.VoucherNo && !x.IsDeleted, cancellationToken);
        if (exists) throw new InvalidOperationException("Voucher number already exists for this company.");
        var voucher = posting.BuildVoucher(request.CompanyId, request.VoucherNo.Trim(), request.VoucherDate, request.VoucherType, request.ReferenceNo, request.Narration, request.CreatedBy,
            request.Lines.Select(x => new VoucherLineDraft(x.AccountId, x.CostCenterId, x.DebitAmount, x.CreditAmount, x.Description)).ToArray());
        await posting.ValidateBalancedAndOpenPeriodAsync(voucher, cancellationToken);
        await uow.Vouchers.AddAsync(voucher, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Vouchers(request.CompanyId), cancellationToken);
        return mapper.Map<VoucherDto>(voucher);
    }

    public async Task<VoucherDto> Handle(SubmitVoucherCommand command, CancellationToken cancellationToken)
    {
        var voucher = await LoadVoucherAsync(command.Id, cancellationToken);
        EnsureEditable(voucher);
        voucher.Status = VoucherStatuses.Submitted;
        voucher.SubmittedBy = command.SubmittedBy;
        voucher.SubmittedAt = BusinessTime.Now;
        db.Add(new AccountsAuditLog { CompanyId = voucher.CompanyId, EntityName = nameof(Voucher), EntityId = voucher.Id, Action = "Submitted", UserId = command.SubmittedBy });
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<VoucherDto>(voucher);
    }

    public async Task<VoucherDto> Handle(ApproveVoucherCommand command, CancellationToken cancellationToken)
    {
        var voucher = await LoadVoucherAsync(command.Id, cancellationToken);
        if (voucher.Status == VoucherStatuses.Posted) throw new InvalidOperationException("Posted voucher cannot be approved again.");
        voucher.Status = VoucherStatuses.Approved;
        voucher.ApprovedBy = command.ApprovedBy;
        voucher.ApprovedAt = BusinessTime.Now;
        db.Add(new AccountsAuditLog { CompanyId = voucher.CompanyId, EntityName = nameof(Voucher), EntityId = voucher.Id, Action = "Approved", UserId = command.ApprovedBy });
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<VoucherDto>(voucher);
    }

    public async Task<VoucherDto> Handle(PostVoucherCommand command, CancellationToken cancellationToken)
    {
        var voucher = await LoadVoucherAsync(command.Id, cancellationToken);
        await posting.PostAsync(voucher, command.PostedBy, cancellationToken);
        await cache.RemoveAsync(CacheKeys.Vouchers(voucher.CompanyId), cancellationToken);
        return mapper.Map<VoucherDto>(voucher);
    }

    public async Task<VoucherDto> Handle(CancelVoucherCommand command, CancellationToken cancellationToken)
    {
        var voucher = await LoadVoucherAsync(command.Id, cancellationToken);
        if (voucher.Status == VoucherStatuses.Posted) throw new InvalidOperationException("Posted voucher cannot be cancelled.");
        voucher.Status = VoucherStatuses.Cancelled;
        voucher.CancelledBy = command.CancelledBy;
        voucher.CancelledAt = BusinessTime.Now;
        db.Add(new AccountsAuditLog { CompanyId = voucher.CompanyId, EntityName = nameof(Voucher), EntityId = voucher.Id, Action = "Cancelled", UserId = command.CancelledBy });
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<VoucherDto>(voucher);
    }

    private async Task<Voucher> LoadVoucherAsync(Guid id, CancellationToken cancellationToken) =>
        await db.Vouchers.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken) ?? throw new KeyNotFoundException("Voucher not found.");

    private static void EnsureEditable(Voucher voucher)
    {
        if (voucher.Status == VoucherStatuses.Posted) throw new InvalidOperationException("Posted voucher cannot be edited.");
        if (voucher.Status == VoucherStatuses.Cancelled) throw new InvalidOperationException("Cancelled voucher cannot be edited.");
    }
}

public sealed class WorkflowCommandHandlers(
    IUnitOfWork uow,
    IAccountsDbContext db,
    IMapper mapper,
    IVoucherPostingService posting,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateCashReceiptCommand, CashReceiptDto>,
    IRequestHandler<ApproveCashReceiptCommand, CashReceiptDto>,
    IRequestHandler<PostCashReceiptCommand, CashReceiptDto>,
    IRequestHandler<CancelCashReceiptCommand, CashReceiptDto>,
    IRequestHandler<CreateMoneyReceiptCommand, MoneyReceiptDto>,
    IRequestHandler<ApproveMoneyReceiptCommand, MoneyReceiptDto>,
    IRequestHandler<PostMoneyReceiptCommand, MoneyReceiptDto>,
    IRequestHandler<CreateDailyExpenseCommand, DailyExpenseDto>,
    IRequestHandler<ApproveDailyExpenseCommand, DailyExpenseDto>,
    IRequestHandler<PayDailyExpenseCommand, DailyExpenseDto>,
    IRequestHandler<RejectDailyExpenseCommand, DailyExpenseDto>,
    IRequestHandler<CreateMoneyRequestCommand, MoneyRequestDto>,
    IRequestHandler<ApproveMoneyRequestCommand, MoneyRequestDto>,
    IRequestHandler<RejectMoneyRequestCommand, MoneyRequestDto>,
    IRequestHandler<PayMoneyRequestCommand, MoneyRequestDto>,
    IRequestHandler<CreateAdvancePaymentCommand, AdvancePaymentDto>,
    IRequestHandler<ApproveAdvancePaymentCommand, AdvancePaymentDto>,
    IRequestHandler<PayAdvancePaymentCommand, AdvancePaymentDto>,
    IRequestHandler<CreateAdvanceSalaryPaymentCommand, AdvanceSalaryPaymentDto>,
    IRequestHandler<ApproveAdvanceSalaryPaymentCommand, AdvanceSalaryPaymentDto>,
    IRequestHandler<PayAdvanceSalaryPaymentCommand, AdvanceSalaryPaymentDto>,
    IRequestHandler<CreateCompanyMoneyTransferCommand, CompanyMoneyTransferDto>,
    IRequestHandler<ApproveCompanyMoneyTransferCommand, CompanyMoneyTransferDto>,
    IRequestHandler<CompleteCompanyMoneyTransferCommand, CompanyMoneyTransferDto>,
    IRequestHandler<RejectCompanyMoneyTransferCommand, CompanyMoneyTransferDto>
{
    public async Task<CashReceiptDto> Handle(CreateCashReceiptCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new CashReceipt { CompanyId = r.CompanyId, ReceiptNo = r.ReceiptNo, ReceiptDate = r.ReceiptDate, ReceivedFromType = r.ReceivedFromType, ReceivedFromId = r.ReceivedFromId, CashOrBankAccountId = r.CashOrBankAccountId, Amount = r.Amount, PaymentMethod = r.PaymentMethod, ReferenceNo = r.ReferenceNo, Purpose = r.Purpose, CreatedBy = r.CreatedBy };
        await uow.CashReceipts.AddAsync(entity, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<CashReceiptDto>(entity);
    }

    public async Task<CashReceiptDto> Handle(ApproveCashReceiptCommand command, CancellationToken cancellationToken)
    {
        var receipt = await uow.CashReceipts.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Cash receipt not found.");
        var credit = await DefaultAccountAsync(receipt.CompanyId, "4100", cancellationToken);
        var voucher = posting.BuildVoucher(receipt.CompanyId, $"RV-{receipt.ReceiptNo}", receipt.ReceiptDate, VoucherTypes.CashReceive, receipt.ReferenceNo, receipt.Purpose, receipt.CreatedBy,
            new VoucherLineDraft(receipt.CashOrBankAccountId, null, receipt.Amount, 0, "Cash or bank received"),
            new VoucherLineDraft(credit.Id, null, 0, receipt.Amount, "Income or receivable credited"));
        await uow.Vouchers.AddAsync(voucher, cancellationToken);
        receipt.Status = WorkflowStatuses.Approved;
        receipt.VoucherId = voucher.Id;
        db.Add(new AccountsAuditLog { CompanyId = receipt.CompanyId, EntityName = nameof(CashReceipt), EntityId = receipt.Id, Action = "Approved", UserId = command.ApprovedBy });
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<CashReceiptDto>(receipt);
    }

    public async Task<CashReceiptDto> Handle(PostCashReceiptCommand command, CancellationToken cancellationToken)
    {
        var receipt = await uow.CashReceipts.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Cash receipt not found.");
        if (!receipt.VoucherId.HasValue) throw new InvalidOperationException("Cash receipt must be approved before posting.");
        var voucher = await LoadVoucherAsync(receipt.VoucherId.Value, cancellationToken);
        await posting.PostAsync(voucher, command.PostedBy, cancellationToken);
        receipt.Status = WorkflowStatuses.Posted;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new CashReceiptPosted(receipt.CompanyId, receipt.Id, voucher.Id, receipt.Amount), cancellationToken);
        return mapper.Map<CashReceiptDto>(receipt);
    }

    public async Task<CashReceiptDto> Handle(CancelCashReceiptCommand command, CancellationToken cancellationToken)
    {
        var receipt = await uow.CashReceipts.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Cash receipt not found.");
        receipt.Status = WorkflowStatuses.Cancelled;
        db.Add(new AccountsAuditLog { CompanyId = receipt.CompanyId, EntityName = nameof(CashReceipt), EntityId = receipt.Id, Action = "Cancelled", UserId = command.CancelledBy });
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<CashReceiptDto>(receipt);
    }

    public async Task<MoneyReceiptDto> Handle(CreateMoneyReceiptCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new MoneyReceipt { CompanyId = r.CompanyId, MoneyReceiptNo = r.MoneyReceiptNo, ReceiptDate = r.ReceiptDate, ReceivedFrom = r.ReceivedFrom, ReceivedFromType = r.ReceivedFromType, Amount = r.Amount, PaymentMethod = r.PaymentMethod, CashOrBankAccountId = r.CashOrBankAccountId, Description = r.Description, CreatedBy = r.CreatedBy };
        await uow.MoneyReceipts.AddAsync(entity, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<MoneyReceiptDto>(entity);
    }

    public async Task<MoneyReceiptDto> Handle(ApproveMoneyReceiptCommand command, CancellationToken cancellationToken)
    {
        var receipt = await uow.MoneyReceipts.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Money receipt not found.");
        receipt.Status = WorkflowStatuses.Approved;
        db.Add(new AccountsAuditLog { CompanyId = receipt.CompanyId, EntityName = nameof(MoneyReceipt), EntityId = receipt.Id, Action = "Approved", UserId = command.ApprovedBy });
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<MoneyReceiptDto>(receipt);
    }

    public async Task<MoneyReceiptDto> Handle(PostMoneyReceiptCommand command, CancellationToken cancellationToken)
    {
        var receipt = await uow.MoneyReceipts.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Money receipt not found.");
        var credit = await DefaultAccountAsync(receipt.CompanyId, "4100", cancellationToken);
        var voucher = posting.BuildVoucher(receipt.CompanyId, $"MRV-{receipt.MoneyReceiptNo}", receipt.ReceiptDate, VoucherTypes.MoneyReceipt, null, receipt.Description, receipt.CreatedBy,
            new VoucherLineDraft(receipt.CashOrBankAccountId, null, receipt.Amount, 0, "Money received"),
            new VoucherLineDraft(credit.Id, null, 0, receipt.Amount, "Income or receivable credited"));
        await uow.Vouchers.AddAsync(voucher, cancellationToken);
        receipt.VoucherId = voucher.Id;
        await uow.SaveChangesAsync(cancellationToken);
        await posting.PostAsync(voucher, command.PostedBy, cancellationToken);
        receipt.Status = WorkflowStatuses.Posted;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<MoneyReceiptDto>(receipt);
    }

    public async Task<DailyExpenseDto> Handle(CreateDailyExpenseCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new DailyExpense { CompanyId = r.CompanyId, ExpenseNo = r.ExpenseNo, ExpenseDate = r.ExpenseDate, ExpenseCategoryId = r.ExpenseCategoryId, PaidFromAccountId = r.PaidFromAccountId, Amount = r.Amount, PaymentMethod = r.PaymentMethod, PaidTo = r.PaidTo, Description = r.Description, RequestedBy = r.RequestedBy, CreatedBy = r.RequestedBy };
        await uow.DailyExpenses.AddAsync(entity, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<DailyExpenseDto>(entity);
    }

    public async Task<DailyExpenseDto> Handle(ApproveDailyExpenseCommand command, CancellationToken cancellationToken)
    {
        var expense = await uow.DailyExpenses.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Daily expense not found.");
        expense.Status = WorkflowStatuses.Approved;
        expense.ApprovedBy = command.ApprovedBy;
        expense.ApprovedAt = BusinessTime.Now;
        db.Add(new AccountsAuditLog { CompanyId = expense.CompanyId, EntityName = nameof(DailyExpense), EntityId = expense.Id, Action = "Approved", UserId = command.ApprovedBy });
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<DailyExpenseDto>(expense);
    }

    public async Task<DailyExpenseDto> Handle(PayDailyExpenseCommand command, CancellationToken cancellationToken)
    {
        var expense = await uow.DailyExpenses.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Daily expense not found.");
        if (expense.Status != WorkflowStatuses.Approved) throw new InvalidOperationException("Daily expense must be approved before payment.");
        var category = await db.ExpenseCategories.FirstOrDefaultAsync(x => x.Id == expense.ExpenseCategoryId, cancellationToken) ?? throw new KeyNotFoundException("Expense category not found.");
        var voucher = posting.BuildVoucher(expense.CompanyId, $"PV-{expense.ExpenseNo}", expense.ExpenseDate, VoucherTypes.DailyExpense, expense.ExpenseNo, expense.Description, expense.RequestedBy,
            new VoucherLineDraft(category.ExpenseAccountId, null, expense.Amount, 0, "Daily expense"),
            new VoucherLineDraft(expense.PaidFromAccountId, null, 0, expense.Amount, "Cash or bank paid"));
        await uow.Vouchers.AddAsync(voucher, cancellationToken);
        expense.VoucherId = voucher.Id;
        await uow.SaveChangesAsync(cancellationToken);
        await posting.PostAsync(voucher, command.PaidBy, cancellationToken);
        expense.Status = WorkflowStatuses.Paid;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new DailyExpensePaid(expense.CompanyId, expense.Id, voucher.Id, expense.Amount), cancellationToken);
        return mapper.Map<DailyExpenseDto>(expense);
    }

    public async Task<DailyExpenseDto> Handle(RejectDailyExpenseCommand command, CancellationToken cancellationToken)
    {
        var expense = await uow.DailyExpenses.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Daily expense not found.");
        expense.Status = WorkflowStatuses.Rejected;
        db.Add(new AccountsAuditLog { CompanyId = expense.CompanyId, EntityName = nameof(DailyExpense), EntityId = expense.Id, Action = "Rejected", UserId = command.RejectedBy });
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<DailyExpenseDto>(expense);
    }

    public async Task<MoneyRequestDto> Handle(CreateMoneyRequestCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new MoneyRequest { CompanyId = r.CompanyId, RequestNo = r.RequestNo, RequestDate = r.RequestDate, RequestedBy = r.RequestedBy, DepartmentId = r.DepartmentId, Purpose = r.Purpose, RequestedAmount = r.RequestedAmount, CreatedBy = r.RequestedBy };
        await uow.MoneyRequests.AddAsync(entity, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<MoneyRequestDto>(entity);
    }

    public async Task<MoneyRequestDto> Handle(ApproveMoneyRequestCommand command, CancellationToken cancellationToken)
    {
        var request = await uow.MoneyRequests.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Money request not found.");
        request.Status = WorkflowStatuses.Approved;
        request.ApprovedAmount = command.Request.ApprovedAmount;
        request.ApprovedBy = command.Request.ApprovedBy;
        request.ApprovedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new MoneyRequestApproved(request.CompanyId, request.Id, request.ApprovedAmount), cancellationToken);
        return mapper.Map<MoneyRequestDto>(request);
    }

    public async Task<MoneyRequestDto> Handle(RejectMoneyRequestCommand command, CancellationToken cancellationToken)
    {
        var request = await uow.MoneyRequests.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Money request not found.");
        request.Status = WorkflowStatuses.Rejected;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<MoneyRequestDto>(request);
    }

    public async Task<MoneyRequestDto> Handle(PayMoneyRequestCommand command, CancellationToken cancellationToken)
    {
        var request = await uow.MoneyRequests.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Money request not found.");
        if (request.Status != WorkflowStatuses.Approved) throw new InvalidOperationException("Request for money must be approved before payment.");
        var cash = await DefaultAccountAsync(request.CompanyId, "1100", cancellationToken);
        var expense = await DefaultAccountAsync(request.CompanyId, "5300", cancellationToken);
        var amount = request.ApprovedAmount > 0 ? request.ApprovedAmount : request.RequestedAmount;
        var voucher = posting.BuildVoucher(request.CompanyId, $"MRP-{request.RequestNo}", DateOnly.FromDateTime(BusinessTime.Now), VoucherTypes.Payment, request.RequestNo, request.Purpose, request.RequestedBy,
            new VoucherLineDraft(expense.Id, null, amount, 0, request.Purpose),
            new VoucherLineDraft(cash.Id, null, 0, amount, "Cash paid"));
        await uow.Vouchers.AddAsync(voucher, cancellationToken);
        request.VoucherId = voucher.Id;
        await uow.SaveChangesAsync(cancellationToken);
        await posting.PostAsync(voucher, command.PaidBy, cancellationToken);
        request.PaidAmount = amount;
        request.PaidBy = command.PaidBy;
        request.PaidAt = BusinessTime.Now;
        request.Status = WorkflowStatuses.Paid;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<MoneyRequestDto>(request);
    }

    public async Task<AdvancePaymentDto> Handle(CreateAdvancePaymentCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new AdvancePayment { CompanyId = r.CompanyId, AdvanceNo = r.AdvanceNo, AdvanceDate = r.AdvanceDate, AdvanceType = r.AdvanceType, PaidToType = r.PaidToType, PaidToId = r.PaidToId, PaidToName = r.PaidToName, PaidFromAccountId = r.PaidFromAccountId, Amount = r.Amount, Purpose = r.Purpose, CreatedBy = r.CreatedBy };
        await uow.AdvancePayments.AddAsync(entity, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<AdvancePaymentDto>(entity);
    }

    public async Task<AdvancePaymentDto> Handle(ApproveAdvancePaymentCommand command, CancellationToken cancellationToken)
    {
        var advance = await uow.AdvancePayments.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Advance payment not found.");
        advance.Status = WorkflowStatuses.Approved;
        advance.ApprovedBy = command.ApprovedBy;
        advance.ApprovedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<AdvancePaymentDto>(advance);
    }

    public async Task<AdvancePaymentDto> Handle(PayAdvancePaymentCommand command, CancellationToken cancellationToken)
    {
        var advance = await uow.AdvancePayments.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Advance payment not found.");
        if (advance.Status != WorkflowStatuses.Approved) throw new InvalidOperationException("Advance pay must be approved before payment.");
        var advanceAccount = await DefaultAccountAsync(advance.CompanyId, "1300", cancellationToken);
        var voucher = posting.BuildVoucher(advance.CompanyId, $"AP-{advance.AdvanceNo}", advance.AdvanceDate, VoucherTypes.AdvancePay, advance.AdvanceNo, advance.Purpose, advance.CreatedBy,
            new VoucherLineDraft(advanceAccount.Id, null, advance.Amount, 0, "Advance paid"),
            new VoucherLineDraft(advance.PaidFromAccountId, null, 0, advance.Amount, "Cash or bank paid"));
        await uow.Vouchers.AddAsync(voucher, cancellationToken);
        advance.VoucherId = voucher.Id;
        await uow.SaveChangesAsync(cancellationToken);
        await posting.PostAsync(voucher, command.PaidBy, cancellationToken);
        advance.Status = WorkflowStatuses.Paid;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new AdvancePaymentPaid(advance.CompanyId, advance.Id, voucher.Id, advance.Amount), cancellationToken);
        return mapper.Map<AdvancePaymentDto>(advance);
    }

    public async Task<AdvanceSalaryPaymentDto> Handle(CreateAdvanceSalaryPaymentCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new AdvanceSalaryPayment { CompanyId = r.CompanyId, EmployeeId = r.EmployeeId, AdvanceSalaryNo = r.AdvanceSalaryNo, AdvanceDate = r.AdvanceDate, Amount = r.Amount, DeductionStartYear = r.DeductionStartYear, DeductionStartMonth = r.DeductionStartMonth, InstallmentAmount = r.InstallmentAmount, PaidFromAccountId = r.PaidFromAccountId, CreatedBy = r.CreatedBy };
        await uow.AdvanceSalaryPayments.AddAsync(entity, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<AdvanceSalaryPaymentDto>(entity);
    }

    public async Task<AdvanceSalaryPaymentDto> Handle(ApproveAdvanceSalaryPaymentCommand command, CancellationToken cancellationToken)
    {
        var advance = await uow.AdvanceSalaryPayments.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Advance salary payment not found.");
        advance.Status = WorkflowStatuses.Approved;
        advance.ApprovedBy = command.ApprovedBy;
        advance.ApprovedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<AdvanceSalaryPaymentDto>(advance);
    }

    public async Task<AdvanceSalaryPaymentDto> Handle(PayAdvanceSalaryPaymentCommand command, CancellationToken cancellationToken)
    {
        var advance = await uow.AdvanceSalaryPayments.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Advance salary payment not found.");
        if (advance.Status != WorkflowStatuses.Approved) throw new InvalidOperationException("Advance salary pay must be approved before payment.");
        var advanceAccount = await DefaultAccountAsync(advance.CompanyId, "1310", cancellationToken);
        var voucher = posting.BuildVoucher(advance.CompanyId, $"ASP-{advance.AdvanceSalaryNo}", advance.AdvanceDate, VoucherTypes.AdvanceSalaryPay, advance.AdvanceSalaryNo, "Advance salary paid", advance.CreatedBy,
            new VoucherLineDraft(advanceAccount.Id, null, advance.Amount, 0, "Advance salary"),
            new VoucherLineDraft(advance.PaidFromAccountId, null, 0, advance.Amount, "Cash or bank paid"));
        await uow.Vouchers.AddAsync(voucher, cancellationToken);
        advance.VoucherId = voucher.Id;
        await uow.SaveChangesAsync(cancellationToken);
        await posting.PostAsync(voucher, command.PaidBy, cancellationToken);
        advance.Status = WorkflowStatuses.Paid;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new AdvanceSalaryPaid(advance.CompanyId, advance.EmployeeId, advance.Amount, advance.DeductionStartYear, advance.DeductionStartMonth, advance.InstallmentAmount), cancellationToken);
        return mapper.Map<AdvanceSalaryPaymentDto>(advance);
    }

    public async Task<CompanyMoneyTransferDto> Handle(CreateCompanyMoneyTransferCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new CompanyMoneyTransfer { CompanyId = r.FromCompanyId, TransferNo = r.TransferNo, FromCompanyId = r.FromCompanyId, ToCompanyId = r.ToCompanyId, FromAccountId = r.FromAccountId, ToAccountId = r.ToAccountId, TransferDate = r.TransferDate, Amount = r.Amount, TransferMethod = r.TransferMethod, ReferenceNo = r.ReferenceNo, Purpose = r.Purpose, RequestedBy = r.RequestedBy, CreatedBy = r.RequestedBy };
        await uow.CompanyMoneyTransfers.AddAsync(entity, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<CompanyMoneyTransferDto>(entity);
    }

    public async Task<CompanyMoneyTransferDto> Handle(ApproveCompanyMoneyTransferCommand command, CancellationToken cancellationToken)
    {
        var transfer = await uow.CompanyMoneyTransfers.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Company money transfer not found.");
        transfer.Status = WorkflowStatuses.Approved;
        transfer.ApprovedBy = command.ApprovedBy;
        transfer.ApprovedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<CompanyMoneyTransferDto>(transfer);
    }

    public async Task<CompanyMoneyTransferDto> Handle(CompleteCompanyMoneyTransferCommand command, CancellationToken cancellationToken)
    {
        var transfer = await uow.CompanyMoneyTransfers.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Company money transfer not found.");
        if (transfer.Status != WorkflowStatuses.Approved) throw new InvalidOperationException("Company transfer must be approved before transfer.");
        var receivable = await DefaultAccountAsync(transfer.FromCompanyId, "1400", cancellationToken);
        var payable = await DefaultAccountAsync(transfer.ToCompanyId, "2100", cancellationToken);
        var fromVoucher = posting.BuildVoucher(transfer.FromCompanyId, $"CTF-{transfer.TransferNo}", transfer.TransferDate, VoucherTypes.CompanyTransfer, transfer.ReferenceNo, transfer.Purpose, transfer.RequestedBy,
            new VoucherLineDraft(receivable.Id, null, transfer.Amount, 0, "Intercompany transfer receivable"),
            new VoucherLineDraft(transfer.FromAccountId, null, 0, transfer.Amount, "Cash or bank transferred"));
        var toVoucher = posting.BuildVoucher(transfer.ToCompanyId, $"CTT-{transfer.TransferNo}", transfer.TransferDate, VoucherTypes.CompanyTransfer, transfer.ReferenceNo, transfer.Purpose, transfer.RequestedBy,
            new VoucherLineDraft(transfer.ToAccountId, null, transfer.Amount, 0, "Cash or bank received"),
            new VoucherLineDraft(payable.Id, null, 0, transfer.Amount, "Intercompany transfer payable"));
        await uow.Vouchers.AddAsync(fromVoucher, cancellationToken);
        await uow.Vouchers.AddAsync(toVoucher, cancellationToken);
        transfer.FromCompanyVoucherId = fromVoucher.Id;
        transfer.ToCompanyVoucherId = toVoucher.Id;
        await uow.SaveChangesAsync(cancellationToken);
        await posting.PostAsync(fromVoucher, command.TransferredBy, cancellationToken);
        await posting.PostAsync(toVoucher, command.TransferredBy, cancellationToken);
        transfer.Status = WorkflowStatuses.Transferred;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new CompanyMoneyTransferCompleted(transfer.CompanyId, transfer.Id, transfer.FromCompanyId, transfer.ToCompanyId, transfer.Amount), cancellationToken);
        return mapper.Map<CompanyMoneyTransferDto>(transfer);
    }

    public async Task<CompanyMoneyTransferDto> Handle(RejectCompanyMoneyTransferCommand command, CancellationToken cancellationToken)
    {
        var transfer = await uow.CompanyMoneyTransfers.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Company money transfer not found.");
        transfer.Status = WorkflowStatuses.Rejected;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<CompanyMoneyTransferDto>(transfer);
    }

    private async Task<ChartOfAccount> DefaultAccountAsync(Guid companyId, string accountCode, CancellationToken cancellationToken) =>
        await db.ChartOfAccounts.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.AccountCode == accountCode && !x.IsDeleted, cancellationToken)
        ?? throw new InvalidOperationException($"Default account {accountCode} is missing for this company.");

    private async Task<Voucher> LoadVoucherAsync(Guid id, CancellationToken cancellationToken) =>
        await db.Vouchers.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw new KeyNotFoundException("Voucher not found.");
}

internal static class CacheKeys
{
    public static string Coa(Guid companyId) => $"accounts:coa:{companyId}";
    public static string Vouchers(Guid companyId) => $"accounts:vouchers:{companyId}";
}
