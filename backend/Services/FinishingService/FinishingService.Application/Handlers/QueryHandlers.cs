using AutoMapper;
using FinishingService.Contracts;
using FinishingService.Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace FinishingService.Application.Handlers;

public sealed class FinishingQueryHandlers(
    IFinishingDbContext db,
    IMapper mapper,
    IRedisCacheService cache) :
    IRequestHandler<GetFinishingReceivesQuery, IReadOnlyList<FinishingReceiveDto>>,
    IRequestHandler<GetFinishingReceiveByIdQuery, FinishingReceiveDto>,
    IRequestHandler<GetFinishingReceiveQuantityQuery, int>,
    IRequestHandler<GetFinishingBatchesQuery, IReadOnlyList<FinishingBatchDto>>,
    IRequestHandler<GetFinishingBatchByIdQuery, FinishingBatchDto>,
    IRequestHandler<GetFinishingInputsQuery, IReadOnlyList<FinishingInputDto>>,
    IRequestHandler<GetIroningOutputsQuery, IReadOnlyList<IroningOutputDto>>,
    IRequestHandler<GetFinishingQCsQuery, IReadOnlyList<FinishingQCDto>>,
    IRequestHandler<GetFoldingPackingsQuery, IReadOnlyList<FoldingPackingDto>>,
    IRequestHandler<GetCartonPackingsQuery, IReadOnlyList<CartonPackingDto>>,
    IRequestHandler<GetCartonPackingByIdQuery, CartonPackingDto>,
    IRequestHandler<GetFinishedGoodsTransfersQuery, IReadOnlyList<FinishedGoodsTransferDto>>,
    IRequestHandler<GetFinishedGoodsTransferByIdQuery, FinishedGoodsTransferDto>,
    IRequestHandler<GetFinishingWastagesQuery, IReadOnlyList<FinishingWastageDto>>,
    IRequestHandler<GetFinishingBalancesQuery, IReadOnlyList<FinishingBalanceDto>>,
    IRequestHandler<GetDailyFinishingProductionReportQuery, IReadOnlyList<FinishingReportRowDto>>,
    IRequestHandler<GetOrderFinishingSummaryReportQuery, IReadOnlyList<FinishingReportRowDto>>,
    IRequestHandler<GetFinishingReportQuery, IReadOnlyList<FinishingReportRowDto>>
{
    // Receives
    public async Task<IReadOnlyList<FinishingReceiveDto>> Handle(GetFinishingReceivesQuery q, CancellationToken ct)
    {
        var query = db.FinishingReceives.Include(x => x.Items).Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId);
        if (!string.IsNullOrWhiteSpace(q.Status)) query = query.Where(x => x.Status == q.Status);

        return mapper.Map<IReadOnlyList<FinishingReceiveDto>>(await query.OrderByDescending(x => x.ReceiveDate).ToListAsync(ct));
    }

    public async Task<FinishingReceiveDto> Handle(GetFinishingReceiveByIdQuery q, CancellationToken ct)
    {
        var row = await db.FinishingReceives.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == q.Id, ct)
            ?? throw new KeyNotFoundException("Finishing receive not found.");
        return mapper.Map<FinishingReceiveDto>(row);
    }

    public async Task<int> Handle(GetFinishingReceiveQuantityQuery q, CancellationToken ct)
    {
        var color = string.IsNullOrWhiteSpace(q.Color) ? null : q.Color.Trim();
        var balance = await db.FinishingBalances.FirstOrDefaultAsync(x =>
            x.CompanyId == q.CompanyId && x.OrderId == q.OrderId && x.ColorName == color && x.SizeName == q.Size.Trim(), ct);
        return balance?.FinishingReceiveQty ?? 0;
    }

    // Batches
    public async Task<IReadOnlyList<FinishingBatchDto>> Handle(GetFinishingBatchesQuery q, CancellationToken ct)
    {
        var query = db.FinishingBatches
            .Include(x => x.Inputs)
            .Include(x => x.Ironings)
            .Include(x => x.QCs).ThenInclude(qc => qc.Defects)
            .Include(x => x.Foldings)
            .Where(x => x.CompanyId == q.CompanyId);

        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId);
        if (!string.IsNullOrWhiteSpace(q.Status)) query = query.Where(x => x.Status == q.Status);

        return mapper.Map<IReadOnlyList<FinishingBatchDto>>(await query.OrderByDescending(x => x.BatchDate).ToListAsync(ct));
    }

    public async Task<FinishingBatchDto> Handle(GetFinishingBatchByIdQuery q, CancellationToken ct)
    {
        var row = await db.FinishingBatches
            .Include(x => x.Inputs)
            .Include(x => x.Ironings)
            .Include(x => x.QCs).ThenInclude(qc => qc.Defects)
            .Include(x => x.Foldings)
            .FirstOrDefaultAsync(x => x.Id == q.Id, ct)
            ?? throw new KeyNotFoundException("Finishing batch not found.");
        return mapper.Map<FinishingBatchDto>(row);
    }

    // Inputs, Ironing, QC, Folding
    public async Task<IReadOnlyList<FinishingInputDto>> Handle(GetFinishingInputsQuery q, CancellationToken ct)
    {
        var query = db.FinishingInputs.Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId);
        if (q.BatchId.HasValue) query = query.Where(x => x.FinishingBatchId == q.BatchId);

        return mapper.Map<IReadOnlyList<FinishingInputDto>>(await query.OrderByDescending(x => x.InputDate).ToListAsync(ct));
    }

    public async Task<IReadOnlyList<IroningOutputDto>> Handle(GetIroningOutputsQuery q, CancellationToken ct)
    {
        var query = db.IroningOutputs.Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId);
        if (q.BatchId.HasValue) query = query.Where(x => x.FinishingBatchId == q.BatchId);

        return mapper.Map<IReadOnlyList<IroningOutputDto>>(await query.OrderByDescending(x => x.OutputDate).ToListAsync(ct));
    }

    public async Task<IReadOnlyList<FinishingQCDto>> Handle(GetFinishingQCsQuery q, CancellationToken ct)
    {
        var query = db.FinishingQCs.Include(x => x.Defects).Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId);
        if (q.BatchId.HasValue) query = query.Where(x => x.FinishingBatchId == q.BatchId);

        return mapper.Map<IReadOnlyList<FinishingQCDto>>(await query.OrderByDescending(x => x.QCDate).ToListAsync(ct));
    }

    public async Task<IReadOnlyList<FoldingPackingDto>> Handle(GetFoldingPackingsQuery q, CancellationToken ct)
    {
        var query = db.FoldingPackings.Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId);
        if (q.BatchId.HasValue) query = query.Where(x => x.FinishingBatchId == q.BatchId);

        return mapper.Map<IReadOnlyList<FoldingPackingDto>>(await query.OrderByDescending(x => x.PackingDate).ToListAsync(ct));
    }

    // Carton Packing
    public async Task<IReadOnlyList<CartonPackingDto>> Handle(GetCartonPackingsQuery q, CancellationToken ct)
    {
        var query = db.CartonPackings.Include(x => x.Items).Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId);
        if (q.BuyerPurchaseOrderId.HasValue) query = query.Where(x => x.BuyerPurchaseOrderId == q.BuyerPurchaseOrderId);
        if (!string.IsNullOrWhiteSpace(q.Status)) query = query.Where(x => x.Status == q.Status);

        return mapper.Map<IReadOnlyList<CartonPackingDto>>(await query.OrderByDescending(x => x.PackingDate).ToListAsync(ct));
    }

    public async Task<CartonPackingDto> Handle(GetCartonPackingByIdQuery q, CancellationToken ct)
    {
        var row = await db.CartonPackings.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == q.Id, ct)
            ?? throw new KeyNotFoundException("Carton packing not found.");
        return mapper.Map<CartonPackingDto>(row);
    }

    // Transfers
    public async Task<IReadOnlyList<FinishedGoodsTransferDto>> Handle(GetFinishedGoodsTransfersQuery q, CancellationToken ct)
    {
        var query = db.FinishedGoodsTransfers.Include(x => x.Items).Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId);
        if (!string.IsNullOrWhiteSpace(q.Status)) query = query.Where(x => x.Status == q.Status);

        return mapper.Map<IReadOnlyList<FinishedGoodsTransferDto>>(await query.OrderByDescending(x => x.TransferDate).ToListAsync(ct));
    }

    public async Task<FinishedGoodsTransferDto> Handle(GetFinishedGoodsTransferByIdQuery q, CancellationToken ct)
    {
        var row = await db.FinishedGoodsTransfers.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == q.Id, ct)
            ?? throw new KeyNotFoundException("Finished goods transfer not found.");
        return mapper.Map<FinishedGoodsTransferDto>(row);
    }

    // Wastages & Balances
    public async Task<IReadOnlyList<FinishingWastageDto>> Handle(GetFinishingWastagesQuery q, CancellationToken ct)
    {
        var query = db.FinishingWastages.Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId);
        if (q.BatchId.HasValue) query = query.Where(x => x.FinishingBatchId == q.BatchId);

        return mapper.Map<IReadOnlyList<FinishingWastageDto>>(await query.OrderByDescending(x => x.WastageDate).ToListAsync(ct));
    }

    public async Task<IReadOnlyList<FinishingBalanceDto>> Handle(GetFinishingBalancesQuery q, CancellationToken ct)
    {
        var cacheKey = q.OrderId.HasValue
            ? CacheKeys.Balance(q.CompanyId, q.OrderId.Value)
            : $"finishing:balances:{q.CompanyId}";

        var cached = await cache.GetAsync<IReadOnlyList<FinishingBalanceDto>>(cacheKey, ct);
        if (cached is not null) return cached;

        var query = db.FinishingBalances.Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) query = query.Where(x => x.OrderId == q.OrderId.Value);

        var result = mapper.Map<IReadOnlyList<FinishingBalanceDto>>(await query.OrderBy(x => x.ColorName).ThenBy(x => x.SizeName).ToListAsync(ct));

        await cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10), ct); // 10 minutes cache expiration
        return result;
    }

    // Report Queries
    public async Task<IReadOnlyList<FinishingReportRowDto>> Handle(GetDailyFinishingProductionReportQuery q, CancellationToken ct)
    {
        return await Handle(new GetFinishingReportQuery(q.CompanyId, null, "Daily Production", q.Date, q.Date), ct);
    }

    public async Task<IReadOnlyList<FinishingReportRowDto>> Handle(GetOrderFinishingSummaryReportQuery q, CancellationToken ct)
    {
        return await Handle(new GetFinishingReportQuery(q.CompanyId, q.OrderId, "Order Summary", null, null), ct);
    }

    public async Task<IReadOnlyList<FinishingReportRowDto>> Handle(GetFinishingReportQuery q, CancellationToken ct)
    {
        var type = q.ReportType.Trim().ToLowerInvariant();

        if (type.Contains("receive"))
        {
            var rows = db.FinishingReceiveItems.Include(x => x.FinishingReceive).Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.FinishingReceive!.ReceiveDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.FinishingReceive!.ReceiveDate <= q.ToDate.Value);

            return await rows
                .OrderByDescending(x => x.FinishingReceive!.ReceiveDate)
                .Select(x => new FinishingReportRowDto("Finishing Receive", x.CompanyId, x.OrderId, x.FinishingReceive!.ReceiveNo, x.FinishingReceive.ReceiveDate, x.ColorName, x.SizeName, x.ReceiveQty, 0, x.FinishingReceive.Status))
                .ToListAsync(ct);
        }

        if (type.Contains("input"))
        {
            var rows = db.FinishingInputs.Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.InputDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.InputDate <= q.ToDate.Value);

            return await rows
                .OrderByDescending(x => x.InputDate)
                .Select(x => new FinishingReportRowDto("Finishing Input", x.CompanyId, x.OrderId, null, x.InputDate, x.ColorName, x.SizeName, x.InputQty, 0, null))
                .ToListAsync(ct);
        }

        if (type.Contains("iron"))
        {
            var rows = db.IroningOutputs.Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.OutputDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.OutputDate <= q.ToDate.Value);

            return await rows
                .OrderByDescending(x => x.OutputDate)
                .Select(x => new FinishingReportRowDto("Ironing Output", x.CompanyId, x.OrderId, null, x.OutputDate, x.ColorName, x.SizeName, x.IronQty, 0, $"Re-Iron:{x.ReIronQty}"))
                .ToListAsync(ct);
        }

        if (type.Contains("qc") || type.Contains("defect"))
        {
            var rows = db.FinishingQCs.Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.QCDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.QCDate <= q.ToDate.Value);

            return await rows
                .OrderByDescending(x => x.QCDate)
                .Select(x => new FinishingReportRowDto("QC Report", x.CompanyId, x.OrderId, null, x.QCDate, x.ColorName, x.SizeName, x.PassedQty, x.RejectQty, $"Checked:{x.CheckedQty}; Alter:{x.AlterQty}"))
                .ToListAsync(ct);
        }

        if (type.Contains("folding") || type.Contains("packing") && !type.Contains("carton"))
        {
            var rows = db.FoldingPackings.Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.PackingDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.PackingDate <= q.ToDate.Value);

            return await rows
                .OrderByDescending(x => x.PackingDate)
                .Select(x => new FinishingReportRowDto("Folding / Packing", x.CompanyId, x.OrderId, null, x.PackingDate, x.ColorName, x.SizeName, x.FoldingQty, 0, $"Poly:{x.PolyQty}; Tag:{x.TaggingQty}"))
                .ToListAsync(ct);
        }

        if (type.Contains("carton"))
        {
            var rows = db.CartonPackingItems.Include(x => x.CartonPacking).Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.CartonPacking!.PackingDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.CartonPacking!.PackingDate <= q.ToDate.Value);

            return await rows
                .OrderByDescending(x => x.CartonPacking!.PackingDate)
                .Select(x => new FinishingReportRowDto("Carton Packing", x.CompanyId, x.OrderId, x.CartonPacking!.CartonNo, x.CartonPacking.PackingDate, x.ColorName, x.SizeName, x.Quantity, 0, x.CartonPacking.Status))
                .ToListAsync(ct);
        }

        if (type.Contains("transfer"))
        {
            var rows = db.FinishedGoodsTransferItems.Include(x => x.FinishedGoodsTransfer).Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.FinishedGoodsTransfer!.TransferDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.FinishedGoodsTransfer!.TransferDate <= q.ToDate.Value);

            return await rows
                .OrderByDescending(x => x.FinishedGoodsTransfer!.TransferDate)
                .Select(x => new FinishingReportRowDto("Finished Goods Transfer", x.CompanyId, x.OrderId, x.FinishedGoodsTransfer!.TransferNo, x.FinishedGoodsTransfer.TransferDate, x.ColorName, x.SizeName, x.TransferQty, 0, x.FinishedGoodsTransfer.Status))
                .ToListAsync(ct);
        }

        if (type.Contains("wastage"))
        {
            var rows = db.FinishingWastages.Where(x => x.CompanyId == q.CompanyId);
            if (q.OrderId.HasValue) rows = rows.Where(x => x.OrderId == q.OrderId);
            if (q.FromDate.HasValue) rows = rows.Where(x => x.WastageDate >= q.FromDate.Value);
            if (q.ToDate.HasValue) rows = rows.Where(x => x.WastageDate <= q.ToDate.Value);

            return await rows
                .OrderByDescending(x => x.WastageDate)
                .Select(x => new FinishingReportRowDto("Finishing Wastage", x.CompanyId, x.OrderId, null, x.WastageDate, x.ColorName, x.SizeName, 0, x.WastageQty, x.WastageReason))
                .ToListAsync(ct);
        }

        // Summary or Balance (Default)
        var balanceRows = db.FinishingBalances.Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue) balanceRows = balanceRows.Where(x => x.OrderId == q.OrderId);

        var list = await balanceRows.OrderBy(x => x.ColorName).ThenBy(x => x.SizeName).ToListAsync(ct);
        var label = type.Contains("daily production") ? "Daily Production Report" : "Finishing Summary Report";

        return list.Select(x => new FinishingReportRowDto(
            label,
            x.CompanyId,
            x.OrderId,
            null,
            DateOnly.FromDateTime(x.UpdatedAt ?? BusinessTime.Now),
            x.ColorName,
            x.SizeName,
            x.BalanceQty,
            x.RejectQty,
            $"Sew:{x.SewingOutputQty}; Rec:{x.FinishingReceiveQty}; Inp:{x.FinishingInputQty}; Iron:{x.IronQty}; Pass:{x.QCPassQty}; Carton:{x.CartonQty}; Trsf:{x.TransferQty}"
        )).ToList();
    }
}
