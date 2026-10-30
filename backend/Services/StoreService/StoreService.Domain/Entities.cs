using Erp.BuildingBlocks.SharedKernel;

namespace StoreService.Domain;

public abstract class AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public DateTime? UpdatedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public sealed class ItemCategory : AuditableEntity
{
    public string CategoryName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class StoreUnit : AuditableEntity
{
    public string UnitName { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public string? UnitType { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class StoreItem : AuditableEntity
{
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid UnitId { get; set; }
    public decimal OpeningStock { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal MinimumStockLevel { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? InventoryItemId { get; set; }
    public ItemCategory? Category { get; set; }
    public StoreUnit? Unit { get; set; }
}

public sealed class StoreBuyer : AuditableEntity
{
    public string BuyerName { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class StoreOrder : AuditableEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid BuyerId { get; set; }
    public DateOnly OrderDate { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Remarks { get; set; }
    public StoreBuyer? Buyer { get; set; }
    public ICollection<StoreOrderLine> Lines { get; set; } = [];
}

public sealed class StoreOrderLine : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid ItemId { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? UnitName { get; set; }
    public StoreOrder? Order { get; set; }
    public StoreItem? Item { get; set; }
}

public sealed class StoreBooking : AuditableEntity
{
    public string BookingNumber { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
    public Guid ItemId { get; set; }
    public string BookingType { get; set; } = string.Empty;
    public decimal BookedQuantity { get; set; }
    public decimal IssuedQty { get; set; }
    public DateOnly BookingDate { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Remarks { get; set; }
    public StoreOrder? Order { get; set; }
    public StoreItem? Item { get; set; }
}

public sealed class GoodsReceiptNote : AuditableEntity
{
    public string GrnNo { get; set; } = string.Empty;
    public DateOnly GrnDate { get; set; }
    public string Supplier { get; set; } = string.Empty;
    public string? PoReference { get; set; }
    public string Status { get; set; } = "Received";
    public decimal TotalAmount { get; set; }
    public ICollection<GrnLine> Lines { get; set; } = [];
}

public sealed class GrnLine : AuditableEntity
{
    public Guid GrnId { get; set; }
    public Guid? ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal Rate { get; set; }
    public GoodsReceiptNote? Grn { get; set; }
}

public sealed class StoreStockTransaction : AuditableEntity
{
    public string TransactionNumber { get; set; } = string.Empty;
    public Guid ItemId { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? DepartmentOrLine { get; set; }
    public string? LocationOrBin { get; set; }
    public string? SupplierName { get; set; }
    public DateTime TransactionDate { get; set; } = BusinessTime.Now;
    public StoreItem? Item { get; set; }
}

public static class StoreBookingStatuses
{
    public const string Pending = "Pending";
    public const string Partial = "Partial";
    public const string Completed = "Completed";
}

public static class StoreTransactionTypes
{
    public const string In = "In";
    public const string Out = "Out";
}
