using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record CreateOrderCommand(CreateOrderRequest Request) : IRequest<OrderDto>;
public sealed record UpdateOrderCommand(Guid Id, UpdateOrderRequest Request) : IRequest<OrderDto>;
public sealed record ConfirmOrderCommand(Guid Id) : IRequest<OrderDto>;
public sealed record CancelOrderCommand(Guid Id) : IRequest<OrderDto>;
public sealed record CreateBuyerPoCommand(Guid OrderId, CreateBuyerPoRequest Request) : IRequest<BuyerPurchaseOrderDto>;
public sealed record UpdateBuyerPoCommand(Guid Id, UpdateBuyerPoRequest Request) : IRequest<BuyerPurchaseOrderDto>;
public sealed record CreateColorSizeBreakdownCommand(Guid OrderId, CreateColorSizeBreakdownRequest Request) : IRequest<ColorSizeBreakdownDto>;
public sealed record UpdateColorSizeBreakdownCommand(Guid Id, UpdateColorSizeBreakdownRequest Request) : IRequest<ColorSizeBreakdownDto>;
public sealed record DeleteColorSizeBreakdownCommand(Guid Id) : IRequest<Unit>;
public sealed record CreateBomItemCommand(Guid OrderId, CreateBomItemRequest Request) : IRequest<BomItemDto>;
public sealed record UpdateBomItemCommand(Guid Id, UpdateBomItemRequest Request) : IRequest<BomItemDto>;
public sealed record DeleteBomItemCommand(Guid Id) : IRequest<Unit>;
public sealed record CalculateBomCommand(Guid OrderId) : IRequest<BomCalculationResultDto>;
public sealed record CreateOrderCostingCommand(Guid OrderId, CreateOrderCostingRequest Request) : IRequest<OrderCostingDto>;
public sealed record UpdateOrderCostingCommand(Guid OrderId, CreateOrderCostingRequest Request) : IRequest<OrderCostingDto>;
public sealed record CreateShipmentPlanCommand(CreateShipmentPlanRequest Request) : IRequest<ShipmentPlanDto>;
public sealed record UpdateShipmentPlanCommand(Guid Id, UpdateShipmentPlanRequest Request) : IRequest<ShipmentPlanDto>;
public sealed record PreviewOrderImportCommand(Guid? CompanyId, Stream FileStream) : IRequest<OrderImportPreviewDto>;
public sealed record ImportOrdersCommand(Guid CompanyId, IReadOnlyList<OrderImportRowDto> Rows) : IRequest<OrderImportResultDto>;
