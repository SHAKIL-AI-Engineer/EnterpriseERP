namespace MerchandisingService.Contracts;

public sealed record OrderImportRowDto(
    string OrderNo,
    string BuyerCode,
    string StyleNo,
    DateOnly OrderDate,
    DateOnly? ShipmentDate,
    int TotalQty,
    decimal UnitPrice,
    string Currency,
    string ColorName,
    string SizeName,
    int Quantity);

public sealed record OrderImportPreviewRowDto(
    int RowNumber,
    string OrderNo,
    string BuyerCode,
    string StyleNo,
    string ColorName,
    string SizeName,
    int Quantity,
    bool IsValid,
    string? ErrorMessage);

public sealed record OrderImportPreviewDto(
    IReadOnlyList<OrderImportPreviewRowDto> Rows,
    int TotalCount,
    int ValidCount,
    int InvalidCount);

public sealed record ImportOrdersRequest(Guid CompanyId, IReadOnlyList<OrderImportRowDto> Rows);

public sealed record OrderImportResultDto(
    int CreatedOrderCount,
    int CreatedBreakdownCount,
    IReadOnlyList<OrderDto> Orders);

public sealed record ColorImportResultDto(
    int CreatedCount,
    int UpdatedCount,
    int SkippedCount,
    IReadOnlyList<string> Errors);
