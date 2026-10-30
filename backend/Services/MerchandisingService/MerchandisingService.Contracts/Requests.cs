namespace MerchandisingService.Contracts;

public sealed record CreateBuyerRequest(Guid CompanyId, string BuyerCode, string BuyerName, string? Country, string? ContactPerson, string? Email, string? Phone, string? Address, string? PaymentTerms = null, string? Currency = null, int? LeadTimeDays = null);
public sealed record UpdateBuyerRequest(string BuyerName, string? Country, string? ContactPerson, string? Email, string? Phone, string? Address, bool IsActive, string? PaymentTerms = null, string? Currency = null, int? LeadTimeDays = null);
public sealed record CreateSeasonRequest(Guid CompanyId, string SeasonCode, string SeasonName, int? YearNo);
public sealed record CreateGarmentItemRequest(Guid CompanyId, string ItemCode, string ItemName, string? Category);
public sealed record CreateStyleRequest(Guid CompanyId, Guid BuyerId, Guid? SeasonId, Guid? GarmentItemId, Guid? BrandId, string StyleNo, string? StyleName, string? Description, string? FabricDescription);
public sealed record UpdateStyleRequest(Guid? SeasonId, Guid? GarmentItemId, Guid? BrandId, string? StyleName, string? Description, string? FabricDescription);

public sealed record CreateOrderRequest(Guid CompanyId, Guid BuyerId, Guid StyleId, string OrderNo, DateOnly OrderDate, DateOnly? ShipmentDate, int TotalOrderQty, decimal UnitPrice, string CurrencyCode = "USD");
public sealed record UpdateOrderRequest(DateOnly? ShipmentDate, int TotalOrderQty, decimal UnitPrice, string CurrencyCode);
public sealed record CreateBuyerPoRequest(Guid CompanyId, string PONo, DateOnly? PODate, DateOnly? ShipmentDate, int OrderQty, decimal UnitPrice);
public sealed record UpdateBuyerPoRequest(DateOnly? PODate, DateOnly? ShipmentDate, int OrderQty, decimal UnitPrice, string Status);
public sealed record CreateColorSizeBreakdownRequest(Guid CompanyId, Guid? BuyerPurchaseOrderId, string ColorName, string SizeName, int Quantity);
public sealed record UpdateColorSizeBreakdownRequest(Guid? BuyerPurchaseOrderId, string ColorName, string SizeName, int Quantity);

public sealed record CreateBomItemRequest(Guid CompanyId, string ItemType, string? ItemCode, string ItemName, string UnitName, decimal Consumption, decimal WastagePercent, decimal UnitPrice);
public sealed record UpdateBomItemRequest(string ItemType, string? ItemCode, string ItemName, string UnitName, decimal Consumption, decimal WastagePercent, decimal UnitPrice);
public sealed record CreateOrderCostingRequest(Guid CompanyId, decimal FabricCost, decimal AccessoriesCost, decimal CM, decimal WashingCost, decimal EmbroideryCost, decimal PrintingCost, decimal OtherCost, decimal SellingPrice, decimal FreightCost = 0, decimal CommercialCost = 0, decimal BankCharges = 0, decimal Commission = 0);
public sealed record CreateSampleRequest(Guid CompanyId, Guid BuyerId, Guid StyleId, string SampleType, DateOnly RequestDate, DateOnly? SubmitDate, string? Remarks);
public sealed record CreateShipmentPlanRequest(Guid CompanyId, Guid OrderId, Guid? BuyerPurchaseOrderId, DateOnly PlannedShipmentDate, int PlannedQty, string? ShipmentMode, string? Destination);
public sealed record UpdateShipmentPlanRequest(Guid? BuyerPurchaseOrderId, DateOnly PlannedShipmentDate, int PlannedQty, string? ShipmentMode, string? Destination, string Status);
