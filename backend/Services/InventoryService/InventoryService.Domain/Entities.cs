using Erp.BuildingBlocks.SharedKernel;

namespace InventoryService.Domain;

public abstract class AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public DateTime? UpdatedAt { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public sealed class StockItem : AuditableEntity
{
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public decimal BalanceQty { get; set; }
    public ICollection<StockTransaction> Transactions { get; set; } = [];
}

public sealed class StockTransaction : AuditableEntity
{
    public Guid StockItemId { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string? ReferenceNo { get; set; }
    public DateTime TransactionDate { get; set; } = BusinessTime.Now;
    public StockItem? StockItem { get; set; }
}
