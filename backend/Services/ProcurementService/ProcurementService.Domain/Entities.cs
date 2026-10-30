using Erp.BuildingBlocks.SharedKernel;

namespace ProcurementService.Domain;

public abstract class AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public DateTime? UpdatedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public sealed class SupplierPurchaseOrder : AuditableEntity
{
    public Guid? RequisitionId { get; set; }
    public string PONo { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public DateOnly PODate { get; set; }
    public string Status { get; set; } = "Open";
    public decimal TotalAmount { get; set; }
    public ICollection<SupplierPurchaseOrderLine> Lines { get; set; } = [];
}

public sealed class SupplierPurchaseOrderLine : AuditableEntity
{
    public Guid PurchaseOrderId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public decimal ReceivedQty { get; set; }
    public SupplierPurchaseOrder? PurchaseOrder { get; set; }
}
