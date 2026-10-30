using CuttingService.Application.Services;
using CuttingService.Domain;
using CuttingService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CuttingService.Tests;

public sealed class CuttingBalanceTests
{
    [Fact]
    public async Task Add_output_updates_cutting_balance()
    {
        var options = new DbContextOptionsBuilder<CuttingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        await using var db = new CuttingDbContext(options);
        var service = new CuttingBalanceService(db);
        var output = new CuttingOutput { CompanyId = Guid.NewGuid(), OrderId = Guid.NewGuid(), CuttingPlanId = Guid.NewGuid(), ColorName = "Black", SizeName = "M", OutputQty = 120 };

        await service.AddOutputAsync(output, 500);
        await db.SaveChangesAsync();

        var balance = await db.CuttingBalances.SingleAsync();
        Assert.Equal(500, balance.OrderQty);
        Assert.Equal(120, balance.CutQty);
        Assert.Equal(380, balance.BalanceQty);
    }

    [Fact]
    public void Lay_size_cut_quantity_is_ratio_times_ply()
    {
        var detail = new CuttingLaySizeDetail { RatioQty = 3, PlyQty = 120 };
        detail.CutQty = detail.RatioQty * detail.PlyQty;

        Assert.Equal(360, detail.CutQty);
    }
}
