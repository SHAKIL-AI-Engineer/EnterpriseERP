using CuttingService.Contracts;
using CuttingService.Domain;

namespace CuttingService.Application.Features.Bundles;

internal static class CuttingBundleQueryableExtensions
{
    internal static IQueryable<CuttingBundle> ApplyListFilters(
        this IQueryable<CuttingBundle> rows,
        Guid companyId,
        Guid? orderId,
        Guid? planId,
        string? status,
        string? search)
    {
        rows = rows.Where(x => x.CompanyId == companyId);

        if (orderId.HasValue)
            rows = rows.Where(x => x.OrderId == orderId.Value);

        if (planId.HasValue)
            rows = rows.Where(x => x.CuttingPlanId == planId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            rows = rows.Where(x => x.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            rows = rows.Where(x =>
                x.BundleTag.Contains(term) ||
                x.SizeName.Contains(term) ||
                (x.StyleName != null && x.StyleName.Contains(term)));
        }

        return rows;
    }

    internal static IQueryable<CuttingBundleDto> ProjectToDto(this IQueryable<CuttingBundle> rows) =>
        rows.Select(x => new CuttingBundleDto(
            x.Id,
            x.CompanyId,
            x.OrderId,
            x.CuttingPlanId,
            x.CuttingLayId,
            x.CuttingOutputId,
            x.BundleTag,
            x.PlanNo,
            x.StyleName,
            x.SizeName,
            x.PieceCount,
            x.SerialFrom,
            x.SerialTo,
            x.SerialRange,
            x.WeightKg,
            x.CurrentLocation,
            x.Status));
}
