using AutoMapper;
using CuttingService.Application.Features.Bundles;
using CuttingService.Contracts;
using Erp.BuildingBlocks.Contracts.Pagination;
using MediatR;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace CuttingService.Application.Handlers;

public sealed class QueryHandlers(IUnitOfWork uow, ICuttingDbContext db, IMapper mapper, IRedisCacheService cache) :
    IRequestHandler<GetCuttingPlansQuery, IReadOnlyList<CuttingPlanDto>>,
    IRequestHandler<GetCuttingPlanByIdQuery, CuttingPlanDto>,
    IRequestHandler<GetCuttingPlanSizeBreakdownsQuery, IReadOnlyList<CuttingPlanSizeBreakdownDto>>,
    IRequestHandler<GetFabricIssuesToCuttingQuery, IReadOnlyList<FabricIssueToCuttingDto>>,
    IRequestHandler<GetFabricIssueToCuttingByIdQuery, FabricIssueToCuttingDto>,
    IRequestHandler<GetCuttingLaysQuery, IReadOnlyList<CuttingLayDto>>,
    IRequestHandler<GetCuttingLayByIdQuery, CuttingLayDto>,
    IRequestHandler<GetCuttingOutputsQuery, IReadOnlyList<CuttingOutputDto>>,
    IRequestHandler<GetCuttingOutputByIdQuery, CuttingOutputDto>,
    IRequestHandler<GetCuttingWastagesQuery, IReadOnlyList<CuttingWastageDto>>,
    IRequestHandler<GetCuttingBalancesQuery, IReadOnlyList<CuttingBalanceDto>>,
    IRequestHandler<GetCuttingPanelTransfersQuery, IReadOnlyList<CuttingPanelTransferDto>>,
    IRequestHandler<GetCuttingPanelTransferByIdQuery, CuttingPanelTransferDto>,
    IRequestHandler<GetCuttingReportQuery, IReadOnlyList<CuttingReportRowDto>>,
    IRequestHandler<GetCuttingBundlesQuery, PaginatedList<CuttingBundleDto>>,
    IRequestHandler<GetCuttingBundleSummaryQuery, CuttingBundleSummaryDto>,
    IRequestHandler<GetCuttingBundleByIdQuery, CuttingBundleDto>
{
    public async Task<IReadOnlyList<CuttingPlanDto>> Handle(GetCuttingPlansQuery q, CancellationToken ct)
    {
        var rows = uow.CuttingPlans.Query().Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
        if (!string.IsNullOrWhiteSpace(q.Status)) rows = rows.Where(x => x.Status == q.Status);
        return mapper.Map<IReadOnlyList<CuttingPlanDto>>(await rows.OrderByDescending(x => x.PlanDate).ToListAsync(ct));
    }

    public async Task<CuttingPlanDto> Handle(GetCuttingPlanByIdQuery q, CancellationToken ct) => mapper.Map<CuttingPlanDto>(await uow.CuttingPlans.GetByIdAsync(q.Id, ct) ?? throw new KeyNotFoundException("Cutting plan not found."));
    public async Task<IReadOnlyList<CuttingPlanSizeBreakdownDto>> Handle(GetCuttingPlanSizeBreakdownsQuery q, CancellationToken ct) => mapper.Map<IReadOnlyList<CuttingPlanSizeBreakdownDto>>(await uow.SizeBreakdowns.Query().Where(x => x.CuttingPlanId == q.PlanId).OrderBy(x => x.SizeName).ToListAsync(ct));

    public async Task<IReadOnlyList<FabricIssueToCuttingDto>> Handle(GetFabricIssuesToCuttingQuery q, CancellationToken ct)
    {
        var rows = uow.FabricIssues.Query().Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
        if (q.PlanId.HasValue) rows = rows.Where(x => x.CuttingPlanId == q.PlanId);
        return mapper.Map<IReadOnlyList<FabricIssueToCuttingDto>>(await rows.OrderByDescending(x => x.IssueDate).ToListAsync(ct));
    }

    public async Task<FabricIssueToCuttingDto> Handle(GetFabricIssueToCuttingByIdQuery q, CancellationToken ct) => mapper.Map<FabricIssueToCuttingDto>(await uow.FabricIssues.GetByIdAsync(q.Id, ct) ?? throw new KeyNotFoundException("Fabric issue not found."));

    public async Task<IReadOnlyList<CuttingLayDto>> Handle(GetCuttingLaysQuery q, CancellationToken ct)
    {
        var rows = db.CuttingLays.Include(x => x.SizeDetails).Where(x => x.CompanyId == q.CompanyId);
        if (q.PlanId.HasValue) rows = rows.Where(x => x.CuttingPlanId == q.PlanId);
        return mapper.Map<IReadOnlyList<CuttingLayDto>>(await rows.OrderByDescending(x => x.LayDate).ToListAsync(ct));
    }

    public async Task<CuttingLayDto> Handle(GetCuttingLayByIdQuery q, CancellationToken ct) => mapper.Map<CuttingLayDto>(await db.CuttingLays.Include(x => x.SizeDetails).FirstOrDefaultAsync(x => x.Id == q.Id, ct) ?? throw new KeyNotFoundException("Cutting lay not found."));

    public async Task<IReadOnlyList<CuttingOutputDto>> Handle(GetCuttingOutputsQuery q, CancellationToken ct)
    {
        var rows = uow.Outputs.Query().Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
        if (q.PlanId.HasValue) rows = rows.Where(x => x.CuttingPlanId == q.PlanId);
        return mapper.Map<IReadOnlyList<CuttingOutputDto>>(await rows.OrderByDescending(x => x.OutputDate).ToListAsync(ct));
    }

    public async Task<CuttingOutputDto> Handle(GetCuttingOutputByIdQuery q, CancellationToken ct) => mapper.Map<CuttingOutputDto>(await uow.Outputs.GetByIdAsync(q.Id, ct) ?? throw new KeyNotFoundException("Cutting output not found."));

    public async Task<IReadOnlyList<CuttingWastageDto>> Handle(GetCuttingWastagesQuery q, CancellationToken ct)
    {
        var rows = uow.Wastages.Query().Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
        if (q.PlanId.HasValue) rows = rows.Where(x => x.CuttingPlanId == q.PlanId);
        return mapper.Map<IReadOnlyList<CuttingWastageDto>>(await rows.OrderByDescending(x => x.WastageDate).ToListAsync(ct));
    }

    public async Task<IReadOnlyList<CuttingBalanceDto>> Handle(GetCuttingBalancesQuery q, CancellationToken ct)
    {
        var key = CacheKeys.Balance(q.CompanyId, q.OrderId);
        var cached = await cache.GetAsync<IReadOnlyList<CuttingBalanceDto>>(key, ct);
        if (cached is not null) return cached;
        var result = mapper.Map<IReadOnlyList<CuttingBalanceDto>>(await uow.Balances.Query().Where(x => x.CompanyId == q.CompanyId && x.OrderId == q.OrderId).OrderBy(x => x.ColorName).ThenBy(x => x.SizeName).ToListAsync(ct));
        await cache.SetAsync(key, result, TimeSpan.FromMinutes(10), ct);
        return result;
    }

    public async Task<IReadOnlyList<CuttingPanelTransferDto>> Handle(GetCuttingPanelTransfersQuery q, CancellationToken ct)
    {
        var rows = db.CuttingPanelTransfers.Include(x => x.Items).Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
        return mapper.Map<IReadOnlyList<CuttingPanelTransferDto>>(await rows.OrderByDescending(x => x.TransferDate).ToListAsync(ct));
    }

    public async Task<CuttingPanelTransferDto> Handle(GetCuttingPanelTransferByIdQuery q, CancellationToken ct) => mapper.Map<CuttingPanelTransferDto>(await db.CuttingPanelTransfers.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == q.Id, ct) ?? throw new KeyNotFoundException("Panel transfer not found."));

    public async Task<IReadOnlyList<CuttingReportRowDto>> Handle(GetCuttingReportQuery q, CancellationToken ct)
    {
        var type = q.ReportType.Trim().ToLowerInvariant().Replace("-", " ");
        if (type.Contains("plan") && !type.Contains("panel"))
        {
            var rows = db.CuttingPlans.Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.PlanDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.PlanDate <= q.ToDate.Value);
            return await rows
                .OrderByDescending(x => x.PlanDate)
                .Select(x => new CuttingReportRowDto("Cutting Plan", x.CompanyId, x.OrderId, x.PlanNo, x.PlanDate, x.ColorName, "", x.TotalPlanQty, 0, x.Status))
                .ToListAsync(ct);
        }

        if (type.Contains("lay"))
        {
            var rows = db.CuttingLays.Include(x => x.CuttingPlan).Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.CuttingPlan!.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.LayDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.LayDate <= q.ToDate.Value);
            return await rows
                .OrderByDescending(x => x.LayDate)
                .Select(x => new CuttingReportRowDto("Lay Report", x.CompanyId, x.CuttingPlan!.OrderId, x.CuttingPlan.PlanNo, x.LayDate, x.CuttingPlan.ColorName, x.LayNo, x.LayQty, 0, x.Status))
                .ToListAsync(ct);
        }

        if (type.Contains("transfer") || type.Contains("panel"))
        {
            var rows = db.CuttingPanelTransfers.Include(x => x.Items).Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.TransferDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.TransferDate <= q.ToDate.Value);
            return await rows
                .OrderByDescending(x => x.TransferDate)
                .Select(x => new CuttingReportRowDto("Panel Transfer", x.CompanyId, x.OrderId, x.TransferNo, x.TransferDate, null, "", x.TotalTransferQty, 0, x.Status))
                .ToListAsync(ct);
        }

        if (type.Contains("wastage"))
        {
            var rows = db.CuttingWastages.Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.WastageDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.WastageDate <= q.ToDate.Value);
            return await rows
                .OrderByDescending(x => x.WastageDate)
                .Select(x => new CuttingReportRowDto("Cutting Wastage", x.CompanyId, x.OrderId, null, x.WastageDate, null, "", 0, x.WastageQty, x.WastageReason))
                .ToListAsync(ct);
        }

        if (type.Contains("balance") || type.Contains("summary"))
        {
            var rows = db.CuttingBalances.Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            var balances = await rows.OrderBy(x => x.OrderId).ThenBy(x => x.ColorName).ThenBy(x => x.SizeName).ToListAsync(ct);
            var label = type.Contains("summary") ? "Order Wise Cutting Summary" : "Cutting Balance";
            return balances
                .Select(x => new CuttingReportRowDto(label, x.CompanyId, x.OrderId, null, DateOnly.FromDateTime(x.UpdatedAt ?? BusinessTime.Now), x.ColorName, x.SizeName, x.BalanceQty, 0, $"Order:{x.OrderQty}; Plan:{x.PlanQty}; Cut:{x.CutQty}; Transferred:{x.TransferredQty}"))
                .ToList();
        }

        var outputs = db.CuttingOutputs.Include(x => x.CuttingPlan).Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) outputs = outputs.Where(x => x.OrderId == q.OrderId);
        if (q.FromDate.HasValue) outputs = outputs.Where(x => x.OutputDate >= q.FromDate.Value);
        if (q.ToDate.HasValue) outputs = outputs.Where(x => x.OutputDate <= q.ToDate.Value);
        var outputLabel = type.Contains("daily")
            ? "Daily Cutting Production"
            : type.Contains("monthly")
                ? "Monthly Cutting Summary"
                : type.Contains("color") || type.Contains("size")
                    ? "Color Size Cutting"
                    : "Cutting Output";
        return await outputs
            .OrderByDescending(x => x.OutputDate)
            .ThenBy(x => x.ColorName)
            .ThenBy(x => x.SizeName)
            .Select(x => new CuttingReportRowDto(outputLabel, x.CompanyId, x.OrderId, x.CuttingPlan!.PlanNo, x.OutputDate, x.ColorName, x.SizeName, x.OutputQty, 0, x.Status))
            .ToListAsync(ct);
    }

    public async Task<PaginatedList<CuttingBundleDto>> Handle(GetCuttingBundlesQuery request, CancellationToken ct)
    {
        var q = request.Query;
        q.Normalize();

        var rows = db.CuttingBundles
            .ApplyListFilters(q.CompanyId, q.OrderId, q.PlanId, q.Status, q.Search)
            .OrderByDescending(x => x.CreatedAt);

        return await rows.ProjectToDto().ToPaginatedListAsync(q, ct);
    }

    public async Task<CuttingBundleSummaryDto> Handle(GetCuttingBundleSummaryQuery q, CancellationToken ct)
    {
        var rows = db.CuttingBundles.ApplyListFilters(q.CompanyId, null, null, q.Status, null);
        var bundleCount = await rows.CountAsync(ct);
        var totalPieces = bundleCount == 0 ? 0 : await rows.SumAsync(x => x.PieceCount, ct);
        return new CuttingBundleSummaryDto(bundleCount, totalPieces);
    }

    public async Task<CuttingBundleDto> Handle(GetCuttingBundleByIdQuery q, CancellationToken ct) =>
        mapper.Map<CuttingBundleDto>(await uow.Bundles.GetByIdAsync(q.Id, ct) ?? throw new KeyNotFoundException("Bundle not found."));
}
