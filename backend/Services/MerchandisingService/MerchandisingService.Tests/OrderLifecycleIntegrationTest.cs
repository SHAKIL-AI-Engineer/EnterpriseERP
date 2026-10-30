using AutoMapper;
using Microsoft.Extensions.Logging.Abstractions;
using MerchandisingService.Application;
using MerchandisingService.Application.Common;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using MerchandisingService.Infrastructure.Persistence;
using MerchandisingService.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Tests;

public sealed class OrderLifecycleIntegrationTest
{
    [Fact]
    public async Task Buyer_style_order_breakdown_confirm_lifecycle()
    {
        var options = new DbContextOptionsBuilder<MerchandisingDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new MerchandisingDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var uow = new UnitOfWork(db);
        var mapper = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>(), NullLoggerFactory.Instance).CreateMapper();
        var cache = new NoOpRedisCacheService();
        var publisher = new NoOpIntegrationEventPublisher();
        var buyerHandlers = new BuyerCommandHandlers(uow, mapper, cache, publisher);
        var catalogHandlers = new CatalogCommandHandlers(uow, mapper, cache, publisher);
        var orderHandlers = new OrderCommandHandlers(uow, db, mapper, new BomCalculationService(), new CostingCalculationService(), cache, publisher);

        var companyId = Guid.NewGuid();
        var buyer = await buyerHandlers.Handle(new CreateBuyerCommand(new CreateBuyerRequest(
            companyId, "ZARA", "Zara Retail", "Spain", "Ana", "ana@zara.com", null, null)), CancellationToken.None);

        var style = await catalogHandlers.Handle(new CreateStyleCommand(new CreateStyleRequest(
            companyId, buyer.Id, null, null, null, "ST-1001", "Basic Tee", "Crew neck", "160 GSM")), CancellationToken.None);

        var order = await orderHandlers.Handle(new CreateOrderCommand(new CreateOrderRequest(
            companyId, buyer.Id, style.Id, "PO-1001", DateOnly.FromDateTime(DateTime.Today), DateOnly.FromDateTime(DateTime.Today.AddDays(60)), 500, 4.5m)), CancellationToken.None);

        await orderHandlers.Handle(new CreateColorSizeBreakdownCommand(order.Id, new CreateColorSizeBreakdownRequest(
            companyId, null, "Navy", "M", 250)), CancellationToken.None);
        await orderHandlers.Handle(new CreateColorSizeBreakdownCommand(order.Id, new CreateColorSizeBreakdownRequest(
            companyId, null, "Navy", "L", 250)), CancellationToken.None);

        var confirmed = await orderHandlers.Handle(new ConfirmOrderCommand(order.Id), CancellationToken.None);

        Assert.Equal(OrderStatuses.Confirmed, confirmed.OrderStatus);
        var history = await db.OrderStatusHistories.Where(x => x.OrderId == order.Id).ToListAsync();
        Assert.Contains(history, h => h.ToStatus == OrderStatuses.Confirmed);
    }
}
