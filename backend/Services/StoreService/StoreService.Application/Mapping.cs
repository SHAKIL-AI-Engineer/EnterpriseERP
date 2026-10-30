using StoreService.Contracts;
using StoreService.Domain;

namespace StoreService.Application;

public static class StoreMapping
{
    public static ItemCategoryDto ToDto(this ItemCategory e) =>
        new(e.Id, e.CompanyId, e.CategoryName, e.Description, e.IsActive);

    public static StoreUnitDto ToDto(this StoreUnit e) =>
        new(e.Id, e.CompanyId, e.UnitName, e.ShortName, e.UnitType, e.IsActive);

    public static StoreItemDto ToDto(this StoreItem e) =>
        new(
            e.Id, e.CompanyId, e.ItemCode, e.ItemName, e.CategoryId, e.Category?.CategoryName,
            e.UnitId, e.Unit?.UnitName ?? e.Unit?.ShortName, e.OpeningStock, e.CurrentStock,
            e.MinimumStockLevel, e.UnitPrice, e.Description, e.IsActive, e.InventoryItemId);

    public static StoreBuyerDto ToDto(this StoreBuyer e) =>
        new(e.Id, e.CompanyId, e.BuyerName, e.Country, e.ContactPerson, e.Email, e.Phone, e.IsActive);

    public static StoreOrderLineDto ToDto(this StoreOrderLine line) =>
        new(line.Id, line.ItemId, line.Item?.ItemName, line.Quantity, line.UnitPrice, line.UnitName, line.Quantity * line.UnitPrice);

    public static StoreOrderDto ToDto(this StoreOrder o) =>
        new(
            o.Id, o.CompanyId, o.OrderNumber, o.BuyerId, o.Buyer?.BuyerName ?? string.Empty, o.OrderDate,
            o.Status, o.Remarks, o.Lines.Count, o.Lines.Select(l => l.ToDto()).ToList());

    public static StoreBookingDto ToDto(this StoreBooking b) =>
        new(
            b.Id, b.CompanyId, b.BookingNumber, b.OrderId, b.Order?.OrderNumber ?? string.Empty, b.ItemId,
            b.Item?.ItemName ?? string.Empty, b.Item?.ItemCode ?? string.Empty,
            b.Item?.Unit?.UnitName ?? b.Item?.Unit?.ShortName, b.BookedQuantity, b.IssuedQty,
            b.BookingDate, b.BookingType, b.Status, b.Remarks);

    public static GrnLineDto ToDto(this GrnLine line) =>
        new(line.Id, line.ItemId, line.ItemName, line.Quantity, line.Rate, line.Quantity * line.Rate);

    public static GrnDto ToDto(this GoodsReceiptNote g) =>
        new(g.Id, g.CompanyId, g.GrnNo, g.GrnDate, g.Supplier, g.PoReference, g.Status, g.TotalAmount, g.Lines.Select(l => l.ToDto()).ToList());

    public static StockTransactionDto ToDto(this StoreStockTransaction t) =>
        new(
            t.Id, t.CompanyId, t.TransactionNumber, t.ItemId, t.Item?.ItemName, t.TransactionType,
            t.Quantity, t.ReferenceNumber, t.DepartmentOrLine, t.LocationOrBin, t.SupplierName, t.TransactionDate);
}
