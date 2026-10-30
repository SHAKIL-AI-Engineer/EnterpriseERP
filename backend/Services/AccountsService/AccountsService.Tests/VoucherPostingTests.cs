using AccountsService.Application;
using AccountsService.Application.Services;
using AccountsService.Contracts;
using AccountsService.Domain;
using AccountsService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AccountsService.Tests;

public sealed class VoucherPostingTests
{
    [Fact]
    public async Task Posting_balanced_voucher_creates_general_ledger_entries()
    {
        var options = new DbContextOptionsBuilder<AccountsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new AccountsDbContext(options);
        var publisher = new TestPublisher();
        var service = new VoucherPostingService(db, publisher);
        var companyId = Guid.NewGuid();
        var debitAccount = new ChartOfAccount { CompanyId = companyId, AccountCode = "1100", AccountName = "Cash", AccountType = AccountTypes.Asset, NormalBalance = NormalBalances.Debit };
        var creditAccount = new ChartOfAccount { CompanyId = companyId, AccountCode = "4100", AccountName = "Income", AccountType = AccountTypes.Income, NormalBalance = NormalBalances.Credit };
        db.ChartOfAccounts.AddRange(debitAccount, creditAccount);
        await db.SaveChangesAsync();

        var voucher = service.BuildVoucher(companyId, "JV-001", DateOnly.FromDateTime(DateTime.Today), VoucherTypes.Journal, null, null, null,
            new VoucherLineDraft(debitAccount.Id, null, 100, 0, null),
            new VoucherLineDraft(creditAccount.Id, null, 0, 100, null));
        db.Vouchers.Add(voucher);
        await db.SaveChangesAsync();

        await service.PostAsync(voucher, null);

        Assert.Equal(VoucherStatuses.Posted, voucher.Status);
        Assert.Equal(2, await db.GeneralLedgerEntries.CountAsync());
        Assert.Contains(publisher.Events, x => x is VoucherPosted);
    }

    private sealed class TestPublisher : IIntegrationEventPublisher
    {
        public List<object> Events { get; } = [];
        public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent
        {
            Events.Add(integrationEvent);
            return Task.CompletedTask;
        }
    }
}
