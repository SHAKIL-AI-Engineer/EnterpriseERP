namespace ProcurementService.Contracts;

public sealed record ApiResponse<T>(bool Success, string? Message, T? Data, IReadOnlyList<string>? Errors = null)
{
    public static ApiResponse<T> Ok(T data, string? message = null) => new(true, message, data);
    public static ApiResponse<T> Fail(string message, IReadOnlyList<string>? errors = null) => new(false, message, default, errors);
}

public sealed record SupplierPurchaseOrderDto(Guid Id, Guid CompanyId, Guid? RequisitionId, string PONo, Guid SupplierId, DateOnly PODate, string Status, decimal TotalAmount);
public sealed record SupplierPurchaseOrderLineDto(Guid Id, Guid CompanyId, Guid PurchaseOrderId, string ItemName, decimal Quantity, string UnitName, decimal UnitPrice, decimal LineTotal, decimal ReceivedQty);

public sealed record CreatePurchaseOrderFromRequisitionRequest(Guid CompanyId, Guid SupplierId, string PONo);
public sealed record ReceivePurchaseOrderLineRequest(decimal ReceivedQty);
