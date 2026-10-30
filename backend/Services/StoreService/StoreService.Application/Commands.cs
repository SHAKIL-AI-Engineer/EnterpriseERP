using MediatR;
using StoreService.Contracts;

namespace StoreService.Application;

// Categories
public sealed record GetCategoriesQuery(Guid CompanyId) : IRequest<IReadOnlyList<ItemCategoryDto>>;
public sealed record GetCategoryByIdQuery(Guid CompanyId, Guid Id) : IRequest<ItemCategoryDto>;
public sealed record CreateCategoryCommand(CreateItemCategoryRequest Request) : IRequest<ItemCategoryDto>;
public sealed record UpdateCategoryCommand(Guid Id, UpdateItemCategoryRequest Request) : IRequest<ItemCategoryDto>;
public sealed record DeleteCategoryCommand(Guid CompanyId, Guid Id) : IRequest<Unit>;

// Units
public sealed record GetUnitsQuery(Guid CompanyId) : IRequest<IReadOnlyList<StoreUnitDto>>;
public sealed record GetUnitByIdQuery(Guid CompanyId, Guid Id) : IRequest<StoreUnitDto>;
public sealed record CreateUnitCommand(CreateStoreUnitRequest Request) : IRequest<StoreUnitDto>;
public sealed record UpdateUnitCommand(Guid Id, UpdateStoreUnitRequest Request) : IRequest<StoreUnitDto>;
public sealed record DeleteUnitCommand(Guid CompanyId, Guid Id) : IRequest<Unit>;

// Items
public sealed record GetItemsQuery(Guid CompanyId) : IRequest<IReadOnlyList<StoreItemDto>>;
public sealed record GetItemByIdQuery(Guid CompanyId, Guid Id) : IRequest<StoreItemDto>;
public sealed record CreateItemCommand(CreateStoreItemRequest Request) : IRequest<StoreItemDto>;
public sealed record UpdateItemCommand(Guid Id, UpdateStoreItemRequest Request) : IRequest<StoreItemDto>;
public sealed record DeleteItemCommand(Guid CompanyId, Guid Id) : IRequest<Unit>;

// Buyers
public sealed record GetBuyersQuery(Guid CompanyId) : IRequest<IReadOnlyList<StoreBuyerDto>>;
public sealed record GetBuyerByIdQuery(Guid CompanyId, Guid Id) : IRequest<StoreBuyerDto>;
public sealed record CreateBuyerCommand(CreateStoreBuyerRequest Request) : IRequest<StoreBuyerDto>;
public sealed record UpdateBuyerCommand(Guid Id, UpdateStoreBuyerRequest Request) : IRequest<StoreBuyerDto>;
public sealed record DeleteBuyerCommand(Guid CompanyId, Guid Id) : IRequest<Unit>;

// Orders
public sealed record GetOrdersQuery(Guid CompanyId) : IRequest<IReadOnlyList<StoreOrderDto>>;
public sealed record GetOrderByIdQuery(Guid CompanyId, Guid Id) : IRequest<StoreOrderDto>;
public sealed record CreateOrderCommand(CreateStoreOrderRequest Request) : IRequest<StoreOrderDto>;
public sealed record UpdateOrderCommand(Guid CompanyId, Guid Id, UpdateStoreOrderRequest Request) : IRequest<StoreOrderDto>;
public sealed record DeleteOrderCommand(Guid CompanyId, Guid Id) : IRequest<Unit>;

// Bookings
public sealed record GetBookingsQuery(Guid CompanyId, string? BookingType) : IRequest<IReadOnlyList<StoreBookingDto>>;
public sealed record GetBookingByIdQuery(Guid CompanyId, Guid Id) : IRequest<StoreBookingDto>;
public sealed record CreateBookingCommand(CreateStoreBookingRequest Request) : IRequest<StoreBookingDto>;
public sealed record UpdateBookingCommand(Guid CompanyId, Guid Id, UpdateStoreBookingRequest Request) : IRequest<StoreBookingDto>;
public sealed record IssueBookingCommand(Guid CompanyId, Guid Id, IssueBookingRequest Request) : IRequest<StoreBookingDto>;
public sealed record DeleteBookingCommand(Guid CompanyId, Guid Id) : IRequest<Unit>;

// GRN
public sealed record GetGrnsQuery(Guid CompanyId) : IRequest<IReadOnlyList<GrnDto>>;
public sealed record GetGrnByIdQuery(Guid CompanyId, Guid Id) : IRequest<GrnDto>;
public sealed record CreateGrnCommand(CreateGrnRequest Request) : IRequest<GrnDto>;
public sealed record UpdateGrnCommand(Guid CompanyId, Guid Id, UpdateGrnRequest Request) : IRequest<GrnDto>;
public sealed record DeleteGrnCommand(Guid CompanyId, Guid Id) : IRequest<Unit>;

// Stock
public sealed record StockInCommand(StockMovementRequest Request) : IRequest<StockTransactionDto>;
public sealed record StockOutCommand(StockMovementRequest Request) : IRequest<StockTransactionDto>;
public sealed record GetTransactionsQuery(Guid CompanyId, Guid? ItemId) : IRequest<IReadOnlyList<StockTransactionDto>>;
public sealed record GetDashboardSummaryQuery(Guid CompanyId) : IRequest<StockDashboardSummaryDto>;
public sealed record GetLowStockQuery(Guid CompanyId) : IRequest<IReadOnlyList<StoreItemDto>>;

// Reports & ledger
public sealed record GetShortageReportQuery(Guid CompanyId) : IRequest<IReadOnlyList<StoreBookingDto>>;
public sealed record GetConsumptionReportQuery(Guid CompanyId) : IRequest<IReadOnlyList<OrderConsumptionLineDto>>;
public sealed record GetItemStockReportQuery(Guid CompanyId) : IRequest<IReadOnlyList<StoreItemDto>>;
public sealed record GetBookingVsIssueReportQuery(Guid CompanyId, string? BookingType) : IRequest<IReadOnlyList<BookingVsIssueLineDto>>;
public sealed record GetStockLedgerQuery(Guid CompanyId, Guid ItemId) : IRequest<IReadOnlyList<StockLedgerEntryDto>>;
