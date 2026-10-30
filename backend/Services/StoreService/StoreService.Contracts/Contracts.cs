namespace StoreService.Contracts;

public sealed record ApiResponse<T>(bool Success, string? Message, T? Data, IReadOnlyList<string>? Errors = null)
{
    public static ApiResponse<T> Ok(T data, string? message = null) => new(true, message, data);
    public static ApiResponse<T> Fail(string message, IReadOnlyList<string>? errors = null) => new(false, message, default, errors);
}

public sealed record ItemCategoryDto(Guid Id, Guid CompanyId, string CategoryName, string? Description, bool IsActive);
public sealed record StoreUnitDto(Guid Id, Guid CompanyId, string UnitName, string ShortName, string? UnitType, bool IsActive);
public sealed record StoreItemDto(
    Guid Id, Guid CompanyId, string ItemCode, string ItemName, Guid CategoryId, string? CategoryName,
    Guid UnitId, string? UnitName, decimal OpeningStock, decimal CurrentStock, decimal MinimumStockLevel,
    decimal UnitPrice, string? Description, bool IsActive, Guid? InventoryItemId);
public sealed record StoreBuyerDto(Guid Id, Guid CompanyId, string BuyerName, string? Country, string? ContactPerson, string? Email, string? Phone, bool IsActive);
public sealed record StoreOrderLineDto(Guid Id, Guid ItemId, string? ItemName, decimal Quantity, decimal UnitPrice, string? UnitName, decimal LineTotal);
public sealed record StoreOrderDto(
    Guid Id, Guid CompanyId, string OrderNumber, Guid BuyerId, string BuyerName, DateOnly OrderDate,
    string Status, string? Remarks, int OrderItemsCount, IReadOnlyList<StoreOrderLineDto> Lines);
public sealed record StoreBookingDto(
    Guid Id, Guid CompanyId, string BookingNumber, Guid OrderId, string OrderNumber, Guid ItemId,
    string ItemName, string ItemCode, string? UnitName, decimal BookedQuantity, decimal IssuedQty,
    DateOnly BookingDate, string BookingType, string Status, string? Remarks);
public sealed record GrnLineDto(Guid Id, Guid? ItemId, string ItemName, decimal Quantity, decimal Rate, decimal LineTotal);
public sealed record GrnDto(
    Guid Id, Guid CompanyId, string GrnNo, DateOnly GrnDate, string Supplier, string? PoReference,
    string Status, decimal TotalAmount, IReadOnlyList<GrnLineDto> Lines);
public sealed record StockTransactionDto(
    Guid Id, Guid CompanyId, string TransactionNumber, Guid ItemId, string? ItemName, string TransactionType,
    decimal Quantity, string? ReferenceNumber, string? DepartmentOrLine, string? LocationOrBin,
    string? SupplierName, DateTime TransactionDate);
public sealed record StockDashboardSummaryDto(
    decimal TotalStockValue, int ActiveSKUs, int LowStockItems, int TotalOrders, int PendingBookings);

public sealed record CreateItemCategoryRequest(Guid CompanyId, string CategoryName, string? Description);
public sealed record UpdateItemCategoryRequest(string CategoryName, string? Description, bool IsActive);
public sealed record CreateStoreUnitRequest(Guid CompanyId, string UnitName, string ShortName, string? UnitType);
public sealed record UpdateStoreUnitRequest(string UnitName, string ShortName, string? UnitType, bool IsActive);
public sealed record CreateStoreItemRequest(
    Guid CompanyId, string ItemCode, string ItemName, Guid CategoryId, Guid UnitId,
    decimal OpeningStock, decimal MinimumStockLevel, decimal UnitPrice, string? Description);
public sealed record UpdateStoreItemRequest(
    string ItemName, Guid CategoryId, Guid UnitId, decimal MinimumStockLevel, decimal UnitPrice, string? Description, bool IsActive);
public sealed record CreateStoreBuyerRequest(Guid CompanyId, string BuyerName, string? Country, string? ContactPerson, string? Email, string? Phone);
public sealed record UpdateStoreBuyerRequest(string BuyerName, string? Country, string? ContactPerson, string? Email, string? Phone, bool IsActive);
public sealed record CreateStoreOrderLineRequest(Guid ItemId, decimal Quantity, decimal UnitPrice, string? UnitName);
public sealed record CreateStoreOrderRequest(Guid CompanyId, string OrderNumber, Guid BuyerId, DateOnly OrderDate, string? Remarks, IReadOnlyList<CreateStoreOrderLineRequest> Lines);
public sealed record UpdateStoreOrderRequest(string Status, string? Remarks);
public sealed record CreateStoreBookingRequest(
    Guid CompanyId, Guid OrderId, Guid ItemId, string BookingType, decimal BookedQuantity, DateOnly BookingDate, string? Remarks);
public sealed record UpdateStoreBookingRequest(decimal BookedQuantity, string Status, string? Remarks);
public sealed record IssueBookingRequest(decimal Quantity);
public sealed record StockMovementRequest(
    Guid CompanyId, Guid ItemId, decimal Quantity, string? ReferenceNumber, string? DepartmentOrLine,
    string? LocationOrBin, string? SupplierName, DateTime? TransactionDate);
public sealed record CreateGrnLineRequest(Guid? ItemId, string ItemName, decimal Quantity, decimal Rate);
public sealed record CreateGrnRequest(
    Guid CompanyId, string GrnNo, DateOnly GrnDate, string Supplier, string? PoReference, IReadOnlyList<CreateGrnLineRequest> Lines);
public sealed record UpdateGrnRequest(string Status, string? PoReference);

public sealed record StockLedgerEntryDto(
    Guid TransactionId, string TransactionNumber, DateTime TransactionDate, string TransactionType,
    decimal QuantityIn, decimal QuantityOut, decimal RunningBalance, string? ReferenceNumber);
public sealed record OrderConsumptionLineDto(
    Guid OrderId, string OrderNumber, Guid ItemId, string ItemName, decimal BookedQuantity, decimal IssuedQuantity, decimal ConsumedQuantity);
public sealed record BookingVsIssueLineDto(
    Guid BookingId, string BookingNumber, string OrderNumber, string ItemName, decimal BookedQuantity, decimal IssuedQty, decimal Remaining);
