namespace MerchandisingService.Application.Common;

internal static class CacheKeys
{
    public static string Buyers(Guid companyId) => $"merch:buyers:{companyId}";
    public static string Styles(Guid companyId, Guid? buyerId) => $"merch:styles:{companyId}:{buyerId?.ToString() ?? "all"}";

    /// <summary>
    /// Style list queries use separate cache keys for "all buyers" and per-buyer filters.
    /// Invalidate both whenever a style is created or updated.
    /// </summary>
    public static IEnumerable<string> StyleListInvalidationKeys(Guid companyId, Guid buyerId)
    {
        yield return Styles(companyId, buyerId);
        yield return Styles(companyId, null);
    }
    public static string OrderDetails(Guid orderId) => $"merch:order-details:{orderId}";
    public static string BomItems(Guid orderId) => $"merch:bom:{orderId}";
    public static string Costing(Guid orderId) => $"merch:costing:{orderId}";
}
