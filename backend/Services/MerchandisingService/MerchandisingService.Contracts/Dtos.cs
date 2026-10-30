namespace MerchandisingService.Contracts;

public sealed record BuyerDto(Guid Id, Guid CompanyId, string BuyerCode, string BuyerName, string? Country, string? ContactPerson, string? Email, string? Phone, string? Address, string? PaymentTerms, string? Currency, int? LeadTimeDays, bool IsActive);
public sealed record SeasonDto(Guid Id, Guid CompanyId, string SeasonCode, string SeasonName, int? YearNo, bool IsActive);
public sealed record GarmentItemDto(Guid Id, Guid CompanyId, string ItemCode, string ItemName, string? Category, bool IsActive);
public sealed record StyleDto(Guid Id, Guid CompanyId, Guid BuyerId, Guid? SeasonId, Guid? GarmentItemId, Guid? BrandId, string StyleNo, string? StyleName, string? Description, string? FabricDescription);
public sealed record BuyerPurchaseOrderDto(Guid Id, Guid CompanyId, Guid OrderId, string PONo, DateOnly? PODate, DateOnly? ShipmentDate, int OrderQty, decimal UnitPrice, decimal TotalValue, string Status);
public sealed record ColorSizeBreakdownDto(Guid Id, Guid CompanyId, Guid OrderId, Guid? BuyerPurchaseOrderId, string ColorName, string SizeName, int Quantity);
public sealed record BomItemDto(Guid Id, Guid CompanyId, Guid OrderId, string ItemType, string? ItemCode, string ItemName, string UnitName, decimal Consumption, decimal WastagePercent, decimal RequiredQty, decimal UnitPrice, decimal TotalCost);
public sealed record OrderCostingDto(Guid Id, Guid CompanyId, Guid OrderId, decimal FabricCost, decimal AccessoriesCost, decimal CM, decimal WashingCost, decimal EmbroideryCost, decimal PrintingCost, decimal OtherCost, decimal TotalCost, decimal SellingPrice, decimal ProfitAmount, decimal ProfitPercent, decimal FreightCost, decimal CommercialCost, decimal BankCharges, decimal Commission, decimal FinalFob, string ApprovalStatus);
public sealed record SampleDto(Guid Id, Guid CompanyId, Guid BuyerId, Guid StyleId, string SampleType, DateOnly RequestDate, DateOnly? SubmitDate, DateOnly? ApprovalDate, string Status, string? Remarks);
public sealed record ShipmentPlanDto(Guid Id, Guid CompanyId, Guid OrderId, Guid? BuyerPurchaseOrderId, DateOnly PlannedShipmentDate, int PlannedQty, string? ShipmentMode, string? Destination, string Status);

public sealed record OrderDto(
    Guid Id,
    Guid CompanyId,
    Guid BuyerId,
    Guid StyleId,
    string OrderNo,
    DateOnly OrderDate,
    DateOnly? ShipmentDate,
    int TotalOrderQty,
    decimal UnitPrice,
    decimal TotalValue,
    string CurrencyCode,
    string OrderStatus);

public sealed record OrderDetailsDto(
    OrderDto Order,
    IReadOnlyList<BuyerPurchaseOrderDto> BuyerPurchaseOrders,
    IReadOnlyList<ColorSizeBreakdownDto> ColorSizeBreakdowns,
    IReadOnlyList<BomItemDto> BomItems,
    OrderCostingDto? Costing,
    IReadOnlyList<ShipmentPlanDto> ShipmentPlans);

public sealed record BomCalculationResultDto(Guid OrderId, int TotalRequiredItems, decimal TotalRequiredQuantity, decimal TotalCost);
