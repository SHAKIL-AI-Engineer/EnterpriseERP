using Microsoft.EntityFrameworkCore;
using SewingService.Application.Services;
using SewingService.Domain;
using SewingService.Infrastructure.Persistence;
using SewingService.Infrastructure.Repositories;

namespace SewingService.Tests;

public sealed class SewingBalanceTests
{
    [Fact]
    public async Task Panel_receive_and_sewn_output_update_wip()
    {
        var options = new DbContextOptionsBuilder<SewingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new SewingDbContext(options);
        var uow = new UnitOfWork(db);
        var service = new SewingBalanceService(uow);
        var companyId = Guid.NewGuid();
        var orderId = Guid.NewGuid();

        await service.AddPanelReceivedAsync(companyId, orderId, "Black", "M", 500);
        await service.AddSewnOutputAsync(companyId, orderId, "Black", "M", 120);

        var balance = await db.SewingBalances.SingleAsync();
        Assert.Equal(500, balance.PanelReceivedQty);
        Assert.Equal(120, balance.SewnOutputQty);
        Assert.Equal(380, balance.WipQty);
    }
}
