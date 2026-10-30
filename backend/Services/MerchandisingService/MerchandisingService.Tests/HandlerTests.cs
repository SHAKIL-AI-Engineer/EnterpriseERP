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

public sealed class HandlerTests
{
    private static (MerchandisingDbContext Db, IUnitOfWork Uow, IMerchandisingDbContext DbContext, OrderCommandHandlers OrderHandlers, ShipmentPlanCommandHandlers ShipmentHandlers, ITnaGenerationService TnaService) CreateFixture()
    {
        var options = new DbContextOptionsBuilder<MerchandisingDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new MerchandisingDbContext(options);
        db.Database.EnsureCreated();
        var uow = new UnitOfWork(db);
        var mapper = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>(), NullLoggerFactory.Instance).CreateMapper();
        var cache = new NoOpRedisCacheService();
        var publisher = new NoOpIntegrationEventPublisher();
        var bomCalculator = new BomCalculationService();
        var costingCalculator = new CostingCalculationService();
        var orderHandlers = new OrderCommandHandlers(uow, db, mapper, bomCalculator, costingCalculator, cache, publisher);
        var shipmentHandlers = new ShipmentPlanCommandHandlers(uow, mapper, publisher);
        var tnaService = new TnaGenerationService();
        return (db, uow, db, orderHandlers, shipmentHandlers, tnaService);
    }

    [Fact]
    public async Task Confirm_order_fails_without_breakdown()
    {
        var (_, _, _, orderHandlers, _, _) = CreateFixture();
        var companyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var buyerId = Guid.Parse("30000000-0000-0000-0000-000000000001");
        var styleId = Guid.Parse("33000000-0000-0000-0000-000000000001");

        var order = await orderHandlers.Handle(new CreateOrderCommand(new CreateOrderRequest(
            companyId, buyerId, styleId, "ORD-NO-BD", DateOnly.FromDateTime(DateTime.Today), null, 100, 5m)), CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            orderHandlers.Handle(new ConfirmOrderCommand(order.Id), CancellationToken.None));
    }

    [Fact]
    public async Task Confirm_order_fails_when_breakdown_total_mismatch()
    {
        var (_, _, _, orderHandlers, _, _) = CreateFixture();
        var companyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var buyerId = Guid.Parse("30000000-0000-0000-0000-000000000001");
        var styleId = Guid.Parse("33000000-0000-0000-0000-000000000001");

        var order = await orderHandlers.Handle(new CreateOrderCommand(new CreateOrderRequest(
            companyId, buyerId, styleId, "ORD-MISMATCH", DateOnly.FromDateTime(DateTime.Today), null, 100, 5m)), CancellationToken.None);

        await orderHandlers.Handle(new CreateColorSizeBreakdownCommand(order.Id, new CreateColorSizeBreakdownRequest(
            companyId, null, "Red", "M", 50)), CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            orderHandlers.Handle(new ConfirmOrderCommand(order.Id), CancellationToken.None));
    }

    [Fact]
    public async Task Shipment_plan_qty_cannot_exceed_order_balance()
    {
        var (_, _, _, orderHandlers, shipmentHandlers, _) = CreateFixture();
        var companyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var buyerId = Guid.Parse("30000000-0000-0000-0000-000000000001");
        var styleId = Guid.Parse("33000000-0000-0000-0000-000000000001");

        var order = await orderHandlers.Handle(new CreateOrderCommand(new CreateOrderRequest(
            companyId, buyerId, styleId, "ORD-SHIP", DateOnly.FromDateTime(DateTime.Today), null, 100, 5m)), CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            shipmentHandlers.Handle(new CreateShipmentPlanCommand(new CreateShipmentPlanRequest(
                companyId, order.Id, null, DateOnly.FromDateTime(DateTime.Today.AddDays(30)), 150, "Sea", "EU")), CancellationToken.None));
    }

    [Fact]
    public void Tna_generation_creates_milestones_from_template()
    {
        var (_, uow, _, _, _, tnaService) = CreateFixture();
        var companyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var template = new TnaTemplate
        {
            CompanyId = companyId,
            TemplateName = "Default",
            Milestones =
            [
                new TnaMilestone { CompanyId = companyId, MilestoneName = "Fabric Booking", SequenceNo = 1, PlannedDate = DateOnly.FromDateTime(DateTime.Today) },
                new TnaMilestone { CompanyId = companyId, MilestoneName = "Cutting", SequenceNo = 2, PlannedDate = DateOnly.FromDateTime(DateTime.Today) },
            ],
        };
        var order = new Order
        {
            CompanyId = companyId,
            BuyerId = Guid.Parse("30000000-0000-0000-0000-000000000001"),
            StyleId = Guid.Parse("33000000-0000-0000-0000-000000000001"),
            OrderNo = "ORD-TNA",
            OrderDate = DateOnly.FromDateTime(DateTime.Today),
            TotalOrderQty = 100,
            UnitPrice = 5m,
            TotalValue = 500m,
        };

        var calendar = tnaService.GenerateFromTemplate(order, template, DateOnly.FromDateTime(DateTime.Today));

        Assert.Equal(2, calendar.Milestones.Count);
        Assert.Equal(TnaCalendarStatuses.Active, calendar.Status);
        Assert.True(calendar.EndDate >= calendar.StartDate);
    }
}

internal sealed class NoOpRedisCacheService : IRedisCacheService
{
    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) => Task.FromResult<T?>(default);
    public Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task RemoveAsync(string key, CancellationToken cancellationToken = default) => Task.CompletedTask;
}

internal sealed class NoOpIntegrationEventPublisher : IIntegrationEventPublisher
{
    public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent =>
        Task.CompletedTask;
}
