namespace InventoryService.Contracts;

public sealed record ApiResponse<T>(bool Success, string? Message, T? Data, IReadOnlyList<string>? Errors = null)
{
    public static ApiResponse<T> Ok(T data, string? message = null) => new(true, message, data);
}

public sealed record StockItemDto(Guid Id, Guid CompanyId, string ItemCode, string ItemName, string UnitName, decimal BalanceQty);
public sealed record StockTransactionDto(Guid Id, Guid CompanyId, Guid StockItemId, string ItemCode, string ItemName, string TransactionType, decimal Quantity, string? ReferenceNo, DateTime TransactionDate);

public sealed record ReceiveStockRequest(Guid CompanyId, string ItemCode, string ItemName, string UnitName, decimal Quantity, string? ReferenceNo);
public sealed record IssueStockRequest(Guid CompanyId, decimal Quantity, string? ReferenceNo);
