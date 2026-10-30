using Microsoft.EntityFrameworkCore;
using PayrollService.Application;
using PayrollService.Application.Handlers;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;
using PayrollService.Infrastructure.Persistence;
using Xunit;

namespace PayrollService.Tests;

public sealed class AdvanceApprovalSecurityTests
{
    [Fact]
    public async Task Invalid_installments_do_not_create_an_advance()
    {
        await using var db = CreateDb(); var handler = new SalaryAdvanceHandlers(db, new Publisher());
        var request = new SalaryAdvanceRequest(Guid.NewGuid(), Guid.NewGuid(), "TEST", 100, DateOnly.FromDateTime(DateTime.UtcNow), 1, 2026, 0, Guid.NewGuid());
        var result = await handler.Handle(new CreateSalaryAdvanceCommand(request), CancellationToken.None);
        Assert.False(result.Success); Assert.Empty(db.SalaryAdvances);
    }

    [Fact]
    public async Task Repeated_approval_does_not_duplicate_installments_or_events()
    {
        await using var db = CreateDb(); var publisher = new Publisher(); var handler = new SalaryAdvanceHandlers(db, publisher);
        var advance = new SalaryAdvance { CompanyId = Guid.NewGuid(), EmployeeId = Guid.NewGuid(), AdvanceAmount = 100,
            BalanceAmount = 100, InstallmentAmount = 25, DeductionStartMonth = 1, DeductionStartYear = 2026 };
        db.SalaryAdvances.Add(advance); await db.SaveChangesAsync();
        var command = new ApproveSalaryAdvanceCommand(advance.Id, Guid.NewGuid());
        Assert.True((await handler.Handle(command, CancellationToken.None)).Success);
        Assert.False((await handler.Handle(command, CancellationToken.None)).Success);
        Assert.Equal(4, await db.SalaryAdvanceInstallments.CountAsync()); Assert.Equal(1, publisher.Count);
    }
    private static PayrollDbContext CreateDb() => new(new DbContextOptionsBuilder<PayrollDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private sealed class Publisher : IIntegrationEventPublisher
    {
        public int Count { get; private set; }
        public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent
        { Count++; return Task.CompletedTask; }
    }
}
