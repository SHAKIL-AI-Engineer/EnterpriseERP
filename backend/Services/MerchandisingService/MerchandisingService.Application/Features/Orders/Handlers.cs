using AutoMapper;
using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using MerchandisingService.Application.Common;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace MerchandisingService.Application;

public sealed class OrderCommandHandlers(
    IUnitOfWork uow,
    IMerchandisingDbContext db,
    IMapper mapper,
    IBomCalculationService bomCalculator,
    ICostingCalculationService costingCalculator,
    IRedisCacheService cache,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateOrderCommand, OrderDto>,
    IRequestHandler<UpdateOrderCommand, OrderDto>,
    IRequestHandler<ConfirmOrderCommand, OrderDto>,
    IRequestHandler<CancelOrderCommand, OrderDto>,
    IRequestHandler<CreateBuyerPoCommand, BuyerPurchaseOrderDto>,
    IRequestHandler<UpdateBuyerPoCommand, BuyerPurchaseOrderDto>,
    IRequestHandler<CreateColorSizeBreakdownCommand, ColorSizeBreakdownDto>,
    IRequestHandler<UpdateColorSizeBreakdownCommand, ColorSizeBreakdownDto>,
    IRequestHandler<DeleteColorSizeBreakdownCommand, Unit>,
    IRequestHandler<CreateBomItemCommand, BomItemDto>,
    IRequestHandler<UpdateBomItemCommand, BomItemDto>,
    IRequestHandler<DeleteBomItemCommand, Unit>,
    IRequestHandler<CalculateBomCommand, BomCalculationResultDto>,
    IRequestHandler<CreateOrderCostingCommand, OrderCostingDto>,
    IRequestHandler<UpdateOrderCostingCommand, OrderCostingDto>
{
    public async Task<OrderDto> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.Orders.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.OrderNo == request.OrderNo, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Order number already exists for this company.");
        }

        var buyerExists = await uow.Buyers.Query().AnyAsync(x => x.Id == request.BuyerId && x.CompanyId == request.CompanyId, cancellationToken);
        var styleExists = await uow.Styles.Query().AnyAsync(x => x.Id == request.StyleId && x.CompanyId == request.CompanyId && x.BuyerId == request.BuyerId, cancellationToken);
        if (!buyerExists || !styleExists)
        {
            throw new InvalidOperationException("Buyer/style relationship is invalid for this company.");
        }

        var order = new Order
        {
            CompanyId = request.CompanyId,
            BuyerId = request.BuyerId,
            StyleId = request.StyleId,
            OrderNo = request.OrderNo.Trim(),
            OrderDate = request.OrderDate,
            ShipmentDate = request.ShipmentDate,
            TotalOrderQty = request.TotalOrderQty,
            UnitPrice = request.UnitPrice,
            TotalValue = request.TotalOrderQty * request.UnitPrice,
            CurrencyCode = request.CurrencyCode,
        };

        await uow.Orders.AddAsync(order, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> Handle(UpdateOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        if (order.OrderStatus is OrderStatuses.Cancelled or OrderStatuses.Shipped)
        {
            throw new InvalidOperationException("Closed orders cannot be updated.");
        }

        order.ShipmentDate = command.Request.ShipmentDate;
        order.TotalOrderQty = command.Request.TotalOrderQty;
        order.UnitPrice = command.Request.UnitPrice;
        order.TotalValue = command.Request.TotalOrderQty * command.Request.UnitPrice;
        order.CurrencyCode = command.Request.CurrencyCode;
        order.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> Handle(ConfirmOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        if (order.OrderStatus == OrderStatuses.Cancelled)
        {
            throw new InvalidOperationException("Cancelled order cannot be confirmed.");
        }

        var breakdownTotal = await uow.Breakdowns.Query().Where(x => x.OrderId == order.Id).SumAsync(x => x.Quantity, cancellationToken);
        if (breakdownTotal == 0)
        {
            throw new InvalidOperationException("Order cannot be confirmed without color-size breakdown.");
        }

        if (breakdownTotal != order.TotalOrderQty)
        {
            throw new InvalidOperationException("Color-size breakdown total must equal order quantity.");
        }

        var previous = order.OrderStatus;
        order.OrderStatus = OrderStatuses.Confirmed;
        order.UpdatedAt = BusinessTime.Now;
        db.Add(new OrderStatusHistory { CompanyId = order.CompanyId, OrderId = order.Id, FromStatus = previous, ToStatus = order.OrderStatus, Reason = "Order confirmed." });
        await EnsureTnaCalendarAsync(order, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        await publisher.PublishAsync(new OrderConfirmed(order.CompanyId, order.Id, order.BuyerId, order.StyleId, order.OrderNo, order.TotalOrderQty, order.ShipmentDate), cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> Handle(CancelOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        if (order.OrderStatus == OrderStatuses.InProduction)
        {
            throw new InvalidOperationException("Order in production cannot be cancelled by merchandising.");
        }

        var previous = order.OrderStatus;
        order.OrderStatus = OrderStatuses.Cancelled;
        order.UpdatedAt = BusinessTime.Now;
        db.Add(new OrderStatusHistory { CompanyId = order.CompanyId, OrderId = order.Id, FromStatus = previous, ToStatus = order.OrderStatus, Reason = "Order cancelled." });
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        await publisher.PublishAsync(new OrderCancelled(order.CompanyId, order.Id, order.OrderNo), cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<BuyerPurchaseOrderDto> Handle(CreateBuyerPoCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var request = command.Request;
        var exists = await uow.BuyerPurchaseOrders.Query().AnyAsync(x => x.OrderId == order.Id && x.PONo == request.PONo, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Buyer PO number already exists for this order.");
        }

        var po = new BuyerPurchaseOrder
        {
            CompanyId = request.CompanyId,
            OrderId = order.Id,
            PONo = request.PONo.Trim(),
            PODate = request.PODate,
            ShipmentDate = request.ShipmentDate,
            OrderQty = request.OrderQty,
            UnitPrice = request.UnitPrice,
            TotalValue = request.OrderQty * request.UnitPrice,
        };

        await uow.BuyerPurchaseOrders.AddAsync(po, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<BuyerPurchaseOrderDto>(po);
    }

    public async Task<BuyerPurchaseOrderDto> Handle(UpdateBuyerPoCommand command, CancellationToken cancellationToken)
    {
        var po = await uow.BuyerPurchaseOrders.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Buyer PO not found.");
        po.PODate = command.Request.PODate;
        po.ShipmentDate = command.Request.ShipmentDate;
        po.OrderQty = command.Request.OrderQty;
        po.UnitPrice = command.Request.UnitPrice;
        po.TotalValue = po.OrderQty * po.UnitPrice;
        po.Status = command.Request.Status;
        po.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(po.OrderId), cancellationToken);
        return mapper.Map<BuyerPurchaseOrderDto>(po);
    }

    public async Task<ColorSizeBreakdownDto> Handle(CreateColorSizeBreakdownCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        EnsureDraft(order, "Color-size breakdown can only be changed while order is draft.");
        var request = command.Request;
        var currentQty = await uow.Breakdowns.Query().Where(x => x.OrderId == order.Id).SumAsync(x => x.Quantity, cancellationToken);
        if (currentQty + request.Quantity > order.TotalOrderQty)
        {
            throw new InvalidOperationException("Color-size breakdown quantity cannot exceed order quantity.");
        }

        var breakdown = new OrderColorSizeBreakdown
        {
            CompanyId = request.CompanyId,
            OrderId = order.Id,
            BuyerPurchaseOrderId = request.BuyerPurchaseOrderId,
            ColorName = request.ColorName.Trim(),
            SizeName = request.SizeName.Trim(),
            Quantity = request.Quantity,
        };
        await uow.Breakdowns.AddAsync(breakdown, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<ColorSizeBreakdownDto>(breakdown);
    }

    public async Task<ColorSizeBreakdownDto> Handle(UpdateColorSizeBreakdownCommand command, CancellationToken cancellationToken)
    {
        var breakdown = await uow.Breakdowns.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Color-size breakdown not found.");
        var order = await uow.Orders.GetByIdAsync(breakdown.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        EnsureDraft(order, "Color-size breakdown can only be changed while order is draft.");
        var otherQty = await uow.Breakdowns.Query().Where(x => x.OrderId == order.Id && x.Id != breakdown.Id).SumAsync(x => x.Quantity, cancellationToken);
        if (otherQty + command.Request.Quantity > order.TotalOrderQty)
        {
            throw new InvalidOperationException("Color-size breakdown quantity cannot exceed order quantity.");
        }

        breakdown.BuyerPurchaseOrderId = command.Request.BuyerPurchaseOrderId;
        breakdown.ColorName = command.Request.ColorName.Trim();
        breakdown.SizeName = command.Request.SizeName.Trim();
        breakdown.Quantity = command.Request.Quantity;
        breakdown.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<ColorSizeBreakdownDto>(breakdown);
    }

    public async Task<Unit> Handle(DeleteColorSizeBreakdownCommand command, CancellationToken cancellationToken)
    {
        var breakdown = await uow.Breakdowns.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Color-size breakdown not found.");
        var order = await uow.Orders.GetByIdAsync(breakdown.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        EnsureDraft(order, "Color-size breakdown cannot be deleted after confirmation.");
        uow.Breakdowns.Remove(breakdown);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return Unit.Value;
    }

    public async Task<BomItemDto> Handle(CreateBomItemCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var request = command.Request;
        var item = new BomItem
        {
            CompanyId = request.CompanyId,
            OrderId = order.Id,
            ItemType = request.ItemType,
            ItemCode = request.ItemCode,
            ItemName = request.ItemName.Trim(),
            UnitName = request.UnitName.Trim(),
            Consumption = request.Consumption,
            WastagePercent = request.WastagePercent,
            UnitPrice = request.UnitPrice,
        };
        bomCalculator.Calculate(item, order.TotalOrderQty);
        await uow.BomItems.AddAsync(item, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.BomItems(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        await publisher.PublishAsync(new BomCreated(order.CompanyId, order.Id, await uow.BomItems.Query().CountAsync(x => x.OrderId == order.Id, cancellationToken)), cancellationToken);
        return mapper.Map<BomItemDto>(item);
    }

    public async Task<BomItemDto> Handle(UpdateBomItemCommand command, CancellationToken cancellationToken)
    {
        var item = await uow.BomItems.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("BOM item not found.");
        var order = await uow.Orders.GetByIdAsync(item.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        item.ItemType = command.Request.ItemType;
        item.ItemCode = command.Request.ItemCode;
        item.ItemName = command.Request.ItemName.Trim();
        item.UnitName = command.Request.UnitName.Trim();
        item.Consumption = command.Request.Consumption;
        item.WastagePercent = command.Request.WastagePercent;
        item.UnitPrice = command.Request.UnitPrice;
        item.UpdatedAt = BusinessTime.Now;
        bomCalculator.Calculate(item, order.TotalOrderQty);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.BomItems(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<BomItemDto>(item);
    }

    public async Task<Unit> Handle(DeleteBomItemCommand command, CancellationToken cancellationToken)
    {
        var item = await uow.BomItems.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("BOM item not found.");
        uow.BomItems.Remove(item);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.BomItems(item.OrderId), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(item.OrderId), cancellationToken);
        return Unit.Value;
    }

    public async Task<BomCalculationResultDto> Handle(CalculateBomCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var items = await uow.BomItems.Query().Where(x => x.OrderId == order.Id).ToListAsync(cancellationToken);
        foreach (var item in items)
        {
            bomCalculator.Calculate(item, order.TotalOrderQty);
        }

        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.BomItems(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return bomCalculator.Summarize(order.Id, items);
    }

    public async Task<OrderCostingDto> Handle(CreateOrderCostingCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var exists = await uow.Costings.Query().AnyAsync(x => x.OrderId == order.Id, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Costing already exists for this order. Use PUT to update it.");
        }

        var costing = BuildCosting(order.Id, command.Request);
        costingCalculator.Calculate(costing);
        await uow.Costings.AddAsync(costing, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Costing(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        await publisher.PublishAsync(new CostingCreated(order.CompanyId, order.Id, costing.Id, costing.TotalCost, costing.SellingPrice), cancellationToken);
        return mapper.Map<OrderCostingDto>(costing);
    }

    public async Task<OrderCostingDto> Handle(UpdateOrderCostingCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var costing = await uow.Costings.Query().FirstOrDefaultAsync(x => x.OrderId == order.Id, cancellationToken) ?? throw new KeyNotFoundException("Costing not found.");
        ApplyCosting(costing, command.Request);
        costing.UpdatedAt = BusinessTime.Now;
        costingCalculator.Calculate(costing);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Costing(order.Id), cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        return mapper.Map<OrderCostingDto>(costing);
    }

    private static void EnsureDraft(Order order, string message)
    {
        if (order.OrderStatus != OrderStatuses.Draft)
        {
            throw new InvalidOperationException(message);
        }
    }

    private static OrderCosting BuildCosting(Guid orderId, CreateOrderCostingRequest request)
    {
        var costing = new OrderCosting { CompanyId = request.CompanyId, OrderId = orderId };
        ApplyCosting(costing, request);
        return costing;
    }

    private static void ApplyCosting(OrderCosting costing, CreateOrderCostingRequest request)
    {
        costing.FabricCost = request.FabricCost;
        costing.AccessoriesCost = request.AccessoriesCost;
        costing.CM = request.CM;
        costing.WashingCost = request.WashingCost;
        costing.EmbroideryCost = request.EmbroideryCost;
        costing.PrintingCost = request.PrintingCost;
        costing.OtherCost = request.OtherCost;
        costing.SellingPrice = request.SellingPrice;
        costing.FreightCost = request.FreightCost;
        costing.CommercialCost = request.CommercialCost;
        costing.BankCharges = request.BankCharges;
        costing.Commission = request.Commission;
    }

    private async Task EnsureTnaCalendarAsync(Order order, CancellationToken cancellationToken)
    {
        if (await db.TnaCalendars.AnyAsync(x => x.OrderId == order.Id, cancellationToken))
        {
            return;
        }

        var template = await db.TnaTemplates.Where(x => x.CompanyId == order.CompanyId && x.IsDefault).Include(x => x.Milestones).FirstOrDefaultAsync(cancellationToken);
        var calendar = new TnaCalendar { CompanyId = order.CompanyId, OrderId = order.Id, TemplateId = template?.Id, StartDate = order.OrderDate, Status = TnaCalendarStatuses.Active };
        if (template?.Milestones.Count > 0)
        {
            foreach (var tm in template.Milestones.OrderBy(x => x.SequenceNo))
            {
                calendar.Milestones.Add(new TnaMilestone { CompanyId = order.CompanyId, MilestoneName = tm.MilestoneName, SequenceNo = tm.SequenceNo, PlannedDate = tm.PlannedDate, Status = TnaMilestoneStatuses.Pending });
            }
        }
        else
        {
            calendar.Milestones.Add(new TnaMilestone { CompanyId = order.CompanyId, MilestoneName = "Fabric Booking", SequenceNo = 1, PlannedDate = order.OrderDate.AddDays(7), Status = TnaMilestoneStatuses.Pending });
            calendar.Milestones.Add(new TnaMilestone { CompanyId = order.CompanyId, MilestoneName = "Cutting Start", SequenceNo = 2, PlannedDate = order.OrderDate.AddDays(21), Status = TnaMilestoneStatuses.Pending });
            calendar.Milestones.Add(new TnaMilestone { CompanyId = order.CompanyId, MilestoneName = "Shipment", SequenceNo = 3, PlannedDate = order.ShipmentDate ?? order.OrderDate.AddDays(60), Status = TnaMilestoneStatuses.Pending });
        }

        db.Add(calendar);
        await publisher.PublishAsync(new TnaGenerated(order.CompanyId, order.Id, calendar.Id), cancellationToken);
    }
}


public sealed class ShipmentPlanCommandHandlers(
    IUnitOfWork uow,
    IMapper mapper,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateShipmentPlanCommand, ShipmentPlanDto>,
    IRequestHandler<UpdateShipmentPlanCommand, ShipmentPlanDto>
{
    public async Task<ShipmentPlanDto> Handle(CreateShipmentPlanCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var order = await uow.Orders.GetByIdAsync(request.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        await EnsureShipmentBalanceAsync(order, request.PlannedQty, null, cancellationToken);

        var plan = new ShipmentPlan
        {
            CompanyId = request.CompanyId,
            OrderId = request.OrderId,
            BuyerPurchaseOrderId = request.BuyerPurchaseOrderId,
            PlannedShipmentDate = request.PlannedShipmentDate,
            PlannedQty = request.PlannedQty,
            ShipmentMode = request.ShipmentMode,
            Destination = request.Destination,
        };
        await uow.ShipmentPlans.AddAsync(plan, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new ShipmentPlanCreated(plan.CompanyId, plan.Id, plan.OrderId, plan.PlannedQty), cancellationToken);
        return mapper.Map<ShipmentPlanDto>(plan);
    }

    public async Task<ShipmentPlanDto> Handle(UpdateShipmentPlanCommand command, CancellationToken cancellationToken)
    {
        var plan = await uow.ShipmentPlans.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Shipment plan not found.");
        var order = await uow.Orders.GetByIdAsync(plan.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        await EnsureShipmentBalanceAsync(order, command.Request.PlannedQty, plan.Id, cancellationToken);
        plan.BuyerPurchaseOrderId = command.Request.BuyerPurchaseOrderId;
        plan.PlannedShipmentDate = command.Request.PlannedShipmentDate;
        plan.PlannedQty = command.Request.PlannedQty;
        plan.ShipmentMode = command.Request.ShipmentMode;
        plan.Destination = command.Request.Destination;
        plan.Status = command.Request.Status;
        plan.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<ShipmentPlanDto>(plan);
    }

    private async Task EnsureShipmentBalanceAsync(Order order, int plannedQty, Guid? excludingPlanId, CancellationToken cancellationToken)
    {
        if (order.OrderStatus == OrderStatuses.Cancelled)
        {
            throw new InvalidOperationException("Cancelled order cannot be shipped.");
        }

        var alreadyPlanned = await uow.ShipmentPlans.Query()
            .Where(x => x.OrderId == order.Id && x.Status != ShipmentPlanStatuses.Cancelled && (!excludingPlanId.HasValue || x.Id != excludingPlanId.Value))
            .SumAsync(x => x.PlannedQty, cancellationToken);

        if (alreadyPlanned + plannedQty > order.TotalOrderQty)
        {
            throw new InvalidOperationException("Shipment plan quantity cannot exceed order balance quantity.");
        }
    }
}


public sealed class OrderQueryHandlers(IUnitOfWork uow, IMapper mapper, IRedisCacheService cache) :
    IRequestHandler<GetOrdersQuery, IReadOnlyList<OrderDto>>,
    IRequestHandler<GetOrderByIdQuery, OrderDto>,
    IRequestHandler<GetOrderDetailsQuery, OrderDetailsDto>,
    IRequestHandler<GetBuyerPosQuery, IReadOnlyList<BuyerPurchaseOrderDto>>,
    IRequestHandler<GetColorSizeBreakdownQuery, IReadOnlyList<ColorSizeBreakdownDto>>,
    IRequestHandler<GetBomItemsQuery, IReadOnlyList<BomItemDto>>,
    IRequestHandler<GetOrderCostingQuery, OrderCostingDto?>,
    IRequestHandler<GetShipmentPlansQuery, IReadOnlyList<ShipmentPlanDto>>
{
    public async Task<IReadOnlyList<OrderDto>> Handle(GetOrdersQuery query, CancellationToken cancellationToken)
    {
        var ordersQuery = uow.Orders.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.BuyerId.HasValue)
        {
            ordersQuery = ordersQuery.Where(x => x.BuyerId == query.BuyerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            ordersQuery = ordersQuery.Where(x => x.OrderStatus == query.Status);
        }

        var orders = await ordersQuery.OrderByDescending(x => x.OrderDate).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<OrderDto>>(orders);
    }

    public async Task<OrderDto> Handle(GetOrderByIdQuery query, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        if (order.CompanyId != query.CompanyId)
        {
            throw new KeyNotFoundException("Order not found.");
        }

        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDetailsDto> Handle(GetOrderDetailsQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.OrderDetails(query.Id);
        var cached = await cache.GetAsync<OrderDetailsDto>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var order = await uow.Orders.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var pos = await uow.BuyerPurchaseOrders.Query().Where(x => x.OrderId == query.Id).ToListAsync(cancellationToken);
        var breakdowns = await uow.Breakdowns.Query().Where(x => x.OrderId == query.Id).ToListAsync(cancellationToken);
        var bom = await uow.BomItems.Query().Where(x => x.OrderId == query.Id).ToListAsync(cancellationToken);
        var costing = await uow.Costings.Query().FirstOrDefaultAsync(x => x.OrderId == query.Id, cancellationToken);
        var shipments = await uow.ShipmentPlans.Query().Where(x => x.OrderId == query.Id).ToListAsync(cancellationToken);

        var result = new OrderDetailsDto(
            mapper.Map<OrderDto>(order),
            mapper.Map<IReadOnlyList<BuyerPurchaseOrderDto>>(pos),
            mapper.Map<IReadOnlyList<ColorSizeBreakdownDto>>(breakdowns),
            mapper.Map<IReadOnlyList<BomItemDto>>(bom),
            costing is null ? null : mapper.Map<OrderCostingDto>(costing),
            mapper.Map<IReadOnlyList<ShipmentPlanDto>>(shipments));

        await cache.SetAsync(key, result, TimeSpan.FromMinutes(30), cancellationToken);
        return result;
    }

    public async Task<IReadOnlyList<BuyerPurchaseOrderDto>> Handle(GetBuyerPosQuery query, CancellationToken cancellationToken)
    {
        var pos = await uow.BuyerPurchaseOrders.Query().Where(x => x.OrderId == query.OrderId).OrderBy(x => x.PONo).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<BuyerPurchaseOrderDto>>(pos);
    }

    public async Task<IReadOnlyList<ColorSizeBreakdownDto>> Handle(GetColorSizeBreakdownQuery query, CancellationToken cancellationToken)
    {
        var rows = await uow.Breakdowns.Query().Where(x => x.OrderId == query.OrderId).OrderBy(x => x.ColorName).ThenBy(x => x.SizeName).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<ColorSizeBreakdownDto>>(rows);
    }

    public async Task<IReadOnlyList<BomItemDto>> Handle(GetBomItemsQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.BomItems(query.OrderId);
        var cached = await cache.GetAsync<IReadOnlyList<BomItemDto>>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var rows = await uow.BomItems.Query().Where(x => x.OrderId == query.OrderId).OrderBy(x => x.ItemType).ThenBy(x => x.ItemName).ToListAsync(cancellationToken);
        var result = mapper.Map<IReadOnlyList<BomItemDto>>(rows);
        await cache.SetAsync(key, result, TimeSpan.FromHours(1), cancellationToken);
        return result;
    }

    public async Task<OrderCostingDto?> Handle(GetOrderCostingQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.Costing(query.OrderId);
        var cached = await cache.GetAsync<OrderCostingDto>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var costing = await uow.Costings.Query().FirstOrDefaultAsync(x => x.OrderId == query.OrderId, cancellationToken);
        if (costing is null)
        {
            return null;
        }

        var result = mapper.Map<OrderCostingDto>(costing);
        await cache.SetAsync(key, result, TimeSpan.FromHours(1), cancellationToken);
        return result;
    }

    public async Task<IReadOnlyList<ShipmentPlanDto>> Handle(GetShipmentPlansQuery query, CancellationToken cancellationToken)
    {
        var plansQuery = uow.ShipmentPlans.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue)
        {
            plansQuery = plansQuery.Where(x => x.OrderId == query.OrderId.Value);
        }

        var plans = await plansQuery.OrderBy(x => x.PlannedShipmentDate).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<ShipmentPlanDto>>(plans);
    }
}

public sealed class OrderImportExportHandlers(IMediator mediator, IUnitOfWork uow, IMapper mapper) :
    IRequestHandler<ExportOrderWorksheetQuery, byte[]>,
    IRequestHandler<GetOrderImportTemplateQuery, byte[]>,
    IRequestHandler<PreviewOrderImportCommand, OrderImportPreviewDto>,
    IRequestHandler<ImportOrdersCommand, OrderImportResultDto>
{
    private static readonly string[] ImportHeaders =
    [
        "OrderNo", "BuyerCode", "StyleNo", "OrderDate", "ShipmentDate",
        "TotalQty", "UnitPrice", "Currency", "ColorName", "SizeName", "Quantity"
    ];

    public Task<byte[]> Handle(GetOrderImportTemplateQuery query, CancellationToken cancellationToken) =>
        Task.FromResult(CsvHelper.BuildTemplate(ImportHeaders));

    public async Task<byte[]> Handle(ExportOrderWorksheetQuery query, CancellationToken cancellationToken)
    {
        var worksheet = await mediator.Send(new GetOrderWorksheetQuery(query.OrderId), cancellationToken);
        var order = await uow.Orders.Query()
            .Include(x => x.Buyer)
            .Include(x => x.Style)
            .FirstOrDefaultAsync(x => x.Id == query.OrderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        var buyerCode = order.Buyer?.BuyerCode ?? string.Empty;
        var styleNo = order.Style?.StyleNo ?? string.Empty;
        var rows = new List<IReadOnlyList<string>>();

        foreach (var article in worksheet.Articles)
        {
            foreach (var color in article.Colors)
            {
                foreach (var size in color.SizeBreakdowns)
                {
                    rows.Add([
                        worksheet.ProgramNumber,
                        buyerCode,
                        article.StyleNo,
                        worksheet.OrderDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                        order.ShipmentDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty,
                        article.TotalQty.ToString(CultureInfo.InvariantCulture),
                        order.UnitPrice.ToString(CultureInfo.InvariantCulture),
                        order.CurrencyCode,
                        color.ColorName,
                        size.SizeName,
                        size.Quantity.ToString(CultureInfo.InvariantCulture),
                    ]);
                }
            }
        }

        if (rows.Count == 0)
        {
            rows.Add([
                worksheet.ProgramNumber,
                buyerCode,
                styleNo,
                worksheet.OrderDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                order.ShipmentDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty,
                order.TotalOrderQty.ToString(CultureInfo.InvariantCulture),
                order.UnitPrice.ToString(CultureInfo.InvariantCulture),
                order.CurrencyCode,
                string.Empty,
                string.Empty,
                "0",
            ]);
        }

        return CsvHelper.BuildCsv(ImportHeaders, rows);
    }

    public async Task<OrderImportPreviewDto> Handle(PreviewOrderImportCommand command, CancellationToken cancellationToken)
    {
        var parsedRows = CsvHelper.Parse(command.FileStream);
        var previewRows = new List<OrderImportPreviewRowDto>();
        var rowNumber = 1;

        foreach (var row in parsedRows)
        {
            rowNumber++;
            var importRow = MapImportRow(row, out var parseError);
            if (importRow is null)
            {
                previewRows.Add(new OrderImportPreviewRowDto(rowNumber, CsvHelper.Get(row, "OrderNo"), CsvHelper.Get(row, "BuyerCode"), CsvHelper.Get(row, "StyleNo"), CsvHelper.Get(row, "ColorName"), CsvHelper.Get(row, "SizeName"), 0, false, parseError));
                continue;
            }

            var error = await ValidateImportRowAsync(command.CompanyId, importRow, cancellationToken);
            previewRows.Add(new OrderImportPreviewRowDto(
                rowNumber,
                importRow.OrderNo,
                importRow.BuyerCode,
                importRow.StyleNo,
                importRow.ColorName,
                importRow.SizeName,
                importRow.Quantity,
                error is null,
                error));
        }

        var validCount = previewRows.Count(x => x.IsValid);
        return new OrderImportPreviewDto(previewRows, previewRows.Count, validCount, previewRows.Count - validCount);
    }

    public async Task<OrderImportResultDto> Handle(ImportOrdersCommand command, CancellationToken cancellationToken)
    {
        if (command.Rows.Count == 0)
        {
            throw new InvalidOperationException("No rows supplied for import.");
        }

        foreach (var row in command.Rows)
        {
            var error = await ValidateImportRowAsync(command.CompanyId, row, cancellationToken);
            if (error is not null)
            {
                throw new InvalidOperationException($"Row for order '{row.OrderNo}' is invalid: {error}");
            }
        }

        var createdOrders = new List<OrderDto>();
        var breakdownCount = 0;
        var groups = command.Rows.GroupBy(x => x.OrderNo.Trim(), StringComparer.OrdinalIgnoreCase);

        foreach (var group in groups)
        {
            var first = group.First();
            var buyer = await uow.Buyers.Query().FirstAsync(x => x.CompanyId == command.CompanyId && x.BuyerCode == first.BuyerCode, cancellationToken);
            var style = await uow.Styles.Query().FirstAsync(x => x.CompanyId == command.CompanyId && x.BuyerId == buyer.Id && x.StyleNo == first.StyleNo, cancellationToken);
            var exists = await uow.Orders.Query().AnyAsync(x => x.CompanyId == command.CompanyId && x.OrderNo == first.OrderNo, cancellationToken);
            if (exists)
            {
                throw new InvalidOperationException($"Order number '{first.OrderNo}' already exists for this company.");
            }

            var totalQty = group.Sum(x => x.Quantity);
            var order = new Order
            {
                CompanyId = command.CompanyId,
                BuyerId = buyer.Id,
                StyleId = style.Id,
                OrderNo = first.OrderNo.Trim(),
                OrderDate = first.OrderDate,
                ShipmentDate = first.ShipmentDate,
                TotalOrderQty = totalQty,
                UnitPrice = first.UnitPrice,
                TotalValue = totalQty * first.UnitPrice,
                CurrencyCode = string.IsNullOrWhiteSpace(first.Currency) ? "USD" : first.Currency.Trim(),
            };

            await uow.Orders.AddAsync(order, cancellationToken);

            foreach (var row in group)
            {
                await uow.Breakdowns.AddAsync(new OrderColorSizeBreakdown
                {
                    CompanyId = command.CompanyId,
                    OrderId = order.Id,
                    ColorName = row.ColorName.Trim(),
                    SizeName = row.SizeName.Trim(),
                    Quantity = row.Quantity,
                }, cancellationToken);
                breakdownCount++;
            }

            createdOrders.Add(mapper.Map<OrderDto>(order));
        }

        await uow.SaveChangesAsync(cancellationToken);
        return new OrderImportResultDto(createdOrders.Count, breakdownCount, createdOrders);
    }

    private static OrderImportRowDto? MapImportRow(Dictionary<string, string> row, out string? error)
    {
        error = null;
        var orderNo = CsvHelper.Get(row, "OrderNo");
        var buyerCode = CsvHelper.Get(row, "BuyerCode");
        var styleNo = CsvHelper.Get(row, "StyleNo");
        var colorName = CsvHelper.Get(row, "ColorName");
        var sizeName = CsvHelper.Get(row, "SizeName");
        var currency = CsvHelper.Get(row, "Currency");
        var orderDateRaw = CsvHelper.Get(row, "OrderDate");
        var shipmentDateRaw = CsvHelper.Get(row, "ShipmentDate");
        var totalQtyRaw = CsvHelper.Get(row, "TotalQty");
        var unitPriceRaw = CsvHelper.Get(row, "UnitPrice");
        var quantityRaw = CsvHelper.Get(row, "Quantity");

        if (string.IsNullOrWhiteSpace(orderNo))
        {
            error = "OrderNo is required.";
            return null;
        }

        if (string.IsNullOrWhiteSpace(buyerCode))
        {
            error = "BuyerCode is required.";
            return null;
        }

        if (string.IsNullOrWhiteSpace(styleNo))
        {
            error = "StyleNo is required.";
            return null;
        }

        if (!CsvHelper.TryParseDate(orderDateRaw, out var orderDate))
        {
            error = "OrderDate is invalid.";
            return null;
        }

        DateOnly? shipmentDate = null;
        if (!string.IsNullOrWhiteSpace(shipmentDateRaw))
        {
            if (!CsvHelper.TryParseDate(shipmentDateRaw, out var parsedShipmentDate))
            {
                error = "ShipmentDate is invalid.";
                return null;
            }

            shipmentDate = parsedShipmentDate;
        }

        if (!int.TryParse(totalQtyRaw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var totalQty) || totalQty <= 0)
        {
            totalQty = int.TryParse(quantityRaw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var qtyFallback) ? qtyFallback : 0;
            if (totalQty <= 0)
            {
                error = "TotalQty or Quantity must be a positive integer.";
                return null;
            }
        }

        if (!decimal.TryParse(unitPriceRaw, NumberStyles.Number, CultureInfo.InvariantCulture, out var unitPrice) || unitPrice < 0)
        {
            error = "UnitPrice is invalid.";
            return null;
        }

        if (!int.TryParse(quantityRaw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var quantity) || quantity <= 0)
        {
            error = "Quantity must be a positive integer.";
            return null;
        }

        if (string.IsNullOrWhiteSpace(colorName))
        {
            error = "ColorName is required.";
            return null;
        }

        if (string.IsNullOrWhiteSpace(sizeName))
        {
            error = "SizeName is required.";
            return null;
        }

        return new OrderImportRowDto(
            orderNo,
            buyerCode,
            styleNo,
            orderDate,
            shipmentDate,
            totalQty,
            unitPrice,
            string.IsNullOrWhiteSpace(currency) ? "USD" : currency,
            colorName,
            sizeName,
            quantity);
    }

    private async Task<string?> ValidateImportRowAsync(Guid? companyId, OrderImportRowDto row, CancellationToken cancellationToken)
    {
        if (companyId is null || companyId == Guid.Empty)
        {
            return null;
        }

        var buyer = await uow.Buyers.Query().FirstOrDefaultAsync(x => x.CompanyId == companyId && x.BuyerCode == row.BuyerCode, cancellationToken);
        if (buyer is null)
        {
            return $"Buyer '{row.BuyerCode}' was not found.";
        }

        var styleExists = await uow.Styles.Query().AnyAsync(x => x.CompanyId == companyId && x.BuyerId == buyer.Id && x.StyleNo == row.StyleNo, cancellationToken);
        if (!styleExists)
        {
            return $"Style '{row.StyleNo}' was not found for buyer '{row.BuyerCode}'.";
        }

        var orderExists = await uow.Orders.Query().AnyAsync(x => x.CompanyId == companyId && x.OrderNo == row.OrderNo, cancellationToken);
        if (orderExists)
        {
            return $"Order number '{row.OrderNo}' already exists.";
        }

        return null;
    }
}
