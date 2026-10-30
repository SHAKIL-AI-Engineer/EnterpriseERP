using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record GetOrdersQuery(Guid CompanyId, Guid? BuyerId, string? Status) : IRequest<IReadOnlyList<OrderDto>>;
public sealed record GetOrderByIdQuery(Guid CompanyId, Guid Id) : IRequest<OrderDto>;
public sealed record GetOrderDetailsQuery(Guid Id) : IRequest<OrderDetailsDto>;
public sealed record GetBuyerPosQuery(Guid OrderId) : IRequest<IReadOnlyList<BuyerPurchaseOrderDto>>;
public sealed record GetColorSizeBreakdownQuery(Guid OrderId) : IRequest<IReadOnlyList<ColorSizeBreakdownDto>>;
public sealed record GetBomItemsQuery(Guid OrderId) : IRequest<IReadOnlyList<BomItemDto>>;
public sealed record GetOrderCostingQuery(Guid OrderId) : IRequest<OrderCostingDto?>;
public sealed record GetShipmentPlansQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<ShipmentPlanDto>>;
public sealed record ExportOrderWorksheetQuery(Guid OrderId) : IRequest<byte[]>;
public sealed record GetOrderImportTemplateQuery() : IRequest<byte[]>;
