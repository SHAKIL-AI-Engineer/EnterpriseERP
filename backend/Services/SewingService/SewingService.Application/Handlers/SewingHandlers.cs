using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SewingService.Contracts;
using SewingService.Domain;

namespace SewingService.Application.Handlers;

public sealed class SewingCommandHandlers(
    IUnitOfWork uow,
    IMapper mapper,
    ISewingBalanceService balances,
    IIntegrationEventPublisher publisher,
    IMerchandisingServiceClient merchandising) :
    IRequestHandler<CreateSewingLineCommand, SewingLineDto>,
    IRequestHandler<UpdateSewingLineCommand, SewingLineDto>,
    IRequestHandler<DeleteSewingLineCommand, Unit>,
    IRequestHandler<CreateProductionAssignmentCommand, ProductionAssignmentDto>,
    IRequestHandler<UpdateProductionAssignmentCommand, ProductionAssignmentDto>,
    IRequestHandler<DeleteProductionAssignmentCommand, Unit>,
    IRequestHandler<ActivateProductionAssignmentCommand, ProductionAssignmentDto>,
    IRequestHandler<SaveProductionTargetCommand, ProductionTargetDto>,
    IRequestHandler<DeleteProductionTargetCommand, Unit>,
    IRequestHandler<SaveDailyProductionRecordCommand, DailyProductionRecordDto>,
    IRequestHandler<DeleteDailyProductionRecordCommand, Unit>,
    IRequestHandler<CreateSewingOutputCommand, SewingOutputDto>,
    IRequestHandler<ReceivePanelTransferCommand, PanelTransferReceiptDto>,
    IRequestHandler<ReceivePanelTransferLegacyCommand, PanelTransferReceiptDto>
{
    public async Task<SewingLineDto> Handle(CreateSewingLineCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var entity = new SewingLine
        {
            CompanyId = r.CompanyId,
            SerialNo = r.SerialNo,
            LineName = r.LineName.Trim(),
            Status = r.Status ?? SewingLineStatuses.Active,
        };
        await uow.SewingLines.AddAsync(entity, ct);
        await uow.SaveChangesAsync(ct);
        return mapper.Map<SewingLineDto>(entity);
    }

    public async Task<SewingLineDto> Handle(UpdateSewingLineCommand command, CancellationToken ct)
    {
        var entity = await uow.SewingLines.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Sewing line not found.");
        entity.SerialNo = command.Request.SerialNo;
        entity.LineName = command.Request.LineName.Trim();
        entity.Status = command.Request.Status;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<SewingLineDto>(entity);
    }

    public async Task<Unit> Handle(DeleteSewingLineCommand command, CancellationToken ct)
    {
        var entity = await uow.SewingLines.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Sewing line not found.");
        uow.SewingLines.Remove(entity);
        await uow.SaveChangesAsync(ct);
        return Unit.Value;
    }

    public async Task<ProductionAssignmentDto> Handle(CreateProductionAssignmentCommand command, CancellationToken ct)
    {
        var r = command.Request;
        if (!await merchandising.IsOrderConfirmedAsync(r.CompanyId, r.OrderId, ct))
            throw new InvalidOperationException("Order must be confirmed before assignment.");

        var line = await uow.SewingLines.GetByIdAsync(r.SewingLineId, ct) ?? throw new KeyNotFoundException("Sewing line not found.");
        var entity = new ProductionAssignment
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            SewingLineId = r.SewingLineId,
            TotalTarget = r.TotalTarget,
            AssignDate = r.AssignDate,
            StyleNo = r.StyleNo,
            BuyerName = r.BuyerName,
            Status = r.Status ?? AssignmentStatuses.Draft,
            SewingLine = line,
        };
        await uow.Assignments.AddAsync(entity, ct);
        await uow.SaveChangesAsync(ct);
        await publisher.PublishAsync(new ProductionAssignmentCreated(r.CompanyId, r.OrderId, entity.Id, r.SewingLineId, r.TotalTarget, r.AssignDate), ct);
        return mapper.Map<ProductionAssignmentDto>(entity);
    }

    public async Task<ProductionAssignmentDto> Handle(UpdateProductionAssignmentCommand command, CancellationToken ct)
    {
        var entity = await uow.Assignments.Query().Include(x => x.SewingLine).FirstOrDefaultAsync(x => x.Id == command.Id, ct)
            ?? throw new KeyNotFoundException("Assignment not found.");
        var r = command.Request;
        entity.SewingLineId = r.SewingLineId;
        entity.TotalTarget = r.TotalTarget;
        entity.AssignDate = r.AssignDate;
        entity.StyleNo = r.StyleNo;
        entity.BuyerName = r.BuyerName;
        entity.Status = r.Status;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<ProductionAssignmentDto>(entity);
    }

    public async Task<Unit> Handle(DeleteProductionAssignmentCommand command, CancellationToken ct)
    {
        var entity = await uow.Assignments.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Assignment not found.");
        uow.Assignments.Remove(entity);
        await uow.SaveChangesAsync(ct);
        return Unit.Value;
    }

    public async Task<ProductionAssignmentDto> Handle(ActivateProductionAssignmentCommand command, CancellationToken ct)
    {
        var entity = await uow.Assignments.Query().Include(x => x.SewingLine).FirstOrDefaultAsync(x => x.Id == command.Id, ct)
            ?? throw new KeyNotFoundException("Assignment not found.");
        entity.Status = AssignmentStatuses.Active;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<ProductionAssignmentDto>(entity);
    }

    public async Task<ProductionTargetDto> Handle(SaveProductionTargetCommand command, CancellationToken ct)
    {
        var r = command.Request;
        _ = await uow.Assignments.GetByIdAsync(r.AssignmentId, ct) ?? throw new KeyNotFoundException("Assignment not found.");
        var existing = await uow.Targets.Query().FirstOrDefaultAsync(x => x.AssignmentId == r.AssignmentId && x.TargetDate == r.TargetDate, ct);
        if (existing is null)
        {
            existing = new ProductionTarget
            {
                CompanyId = r.CompanyId,
                AssignmentId = r.AssignmentId,
                TargetDate = r.TargetDate,
                DailyTarget = r.DailyTarget,
                HourlyTarget = r.HourlyTarget,
                Remarks = r.Remarks,
            };
            await uow.Targets.AddAsync(existing, ct);
        }
        else
        {
            existing.DailyTarget = r.DailyTarget;
            existing.HourlyTarget = r.HourlyTarget;
            existing.Remarks = r.Remarks;
        }
        await uow.SaveChangesAsync(ct);
        return mapper.Map<ProductionTargetDto>(existing);
    }

    public async Task<Unit> Handle(DeleteProductionTargetCommand command, CancellationToken ct)
    {
        var entity = await uow.Targets.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Target not found.");
        uow.Targets.Remove(entity);
        await uow.SaveChangesAsync(ct);
        return Unit.Value;
    }

    public async Task<DailyProductionRecordDto> Handle(SaveDailyProductionRecordCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var assignment = await uow.Assignments.GetByIdAsync(r.AssignmentId, ct) ?? throw new KeyNotFoundException("Assignment not found.");
        var total = r.H1 + r.H2 + r.H3 + r.H4 + r.H5 + r.H6 + r.H7 + r.H8 + r.H9 + r.H10
            + r.H11 + r.H12 + r.H13 + r.H14 + r.H15 + r.H16 + r.H17 + r.H18 + r.H19;
        var existing = await uow.DailyRecords.Query().FirstOrDefaultAsync(x => x.AssignmentId == r.AssignmentId && x.RecordDate == r.RecordDate, ct);
        if (existing is null)
        {
            existing = new DailyProductionRecord { CompanyId = r.CompanyId, AssignmentId = r.AssignmentId, RecordDate = r.RecordDate };
            await uow.DailyRecords.AddAsync(existing, ct);
        }
        existing.DailyTarget = r.DailyTarget;
        existing.HourlyTarget = r.HourlyTarget;
        existing.H1 = r.H1; existing.H2 = r.H2; existing.H3 = r.H3; existing.H4 = r.H4; existing.H5 = r.H5;
        existing.H6 = r.H6; existing.H7 = r.H7; existing.H8 = r.H8; existing.H9 = r.H9; existing.H10 = r.H10;
        existing.H11 = r.H11; existing.H12 = r.H12; existing.H13 = r.H13; existing.H14 = r.H14; existing.H15 = r.H15;
        existing.H16 = r.H16; existing.H17 = r.H17; existing.H18 = r.H18; existing.H19 = r.H19;
        existing.TotalCompleted = total;
        await uow.SaveChangesAsync(ct);

        if (total > 0)
        {
            var output = new SewingOutput
            {
                CompanyId = assignment.CompanyId,
                OrderId = assignment.OrderId,
                AssignmentId = assignment.Id,
                OutputNo = $"DLY-{r.RecordDate:yyyyMMdd}-{assignment.Id:N}".Substring(0, 32),
                OutputDate = r.RecordDate,
                SizeName = "MIXED",
                OutputQty = total,
            };
            await uow.Outputs.AddAsync(output, ct);
            await balances.AddSewnOutputAsync(assignment.CompanyId, assignment.OrderId, null, "MIXED", total, ct);
            await publisher.PublishAsync(new SewingOutputCreated(assignment.CompanyId, assignment.OrderId, output.Id, null, "MIXED", total, r.RecordDate), ct);
        }
        return mapper.Map<DailyProductionRecordDto>(existing);
    }

    public async Task<Unit> Handle(DeleteDailyProductionRecordCommand command, CancellationToken ct)
    {
        var entity = await uow.DailyRecords.Query()
            .FirstOrDefaultAsync(x => x.AssignmentId == command.AssignmentId && x.RecordDate == command.RecordDate, ct)
            ?? throw new KeyNotFoundException("Daily record not found.");
        uow.DailyRecords.Remove(entity);
        await uow.SaveChangesAsync(ct);
        return Unit.Value;
    }

    public async Task<SewingOutputDto> Handle(CreateSewingOutputCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var balance = await balances.GetOrCreateAsync(r.CompanyId, r.OrderId, r.ColorName, r.SizeName, ct);
        if (balance.WipQty < r.OutputQty && !r.ApproveOverage)
            throw new InvalidOperationException("Output exceeds WIP balance.");

        var entity = new SewingOutput
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            AssignmentId = r.AssignmentId,
            OutputNo = $"OUT-{DateTime.UtcNow:yyyyMMddHHmmss}",
            OutputDate = r.OutputDate,
            ColorName = r.ColorName,
            SizeName = r.SizeName.Trim(),
            OutputQty = r.OutputQty,
            Status = r.ApproveOverage ? SewingOutputStatuses.ApprovedOverage : SewingOutputStatuses.Created,
        };
        await uow.Outputs.AddAsync(entity, ct);
        await balances.AddSewnOutputAsync(r.CompanyId, r.OrderId, r.ColorName, r.SizeName, r.OutputQty, ct);
        await uow.SaveChangesAsync(ct);
        await publisher.PublishAsync(new SewingOutputCreated(r.CompanyId, r.OrderId, entity.Id, r.ColorName, r.SizeName, r.OutputQty, r.OutputDate), ct);
        await publisher.PublishAsync(new ProductionOutputCreated(r.CompanyId, r.OrderId, entity.Id, r.ColorName, r.SizeName, r.OutputQty, r.OutputDate), ct);
        return mapper.Map<SewingOutputDto>(entity);
    }

    public async Task<PanelTransferReceiptDto> Handle(ReceivePanelTransferCommand command, CancellationToken ct)
    {
        var r = command.Request;
        return await ReceivePanelInternal(r.CompanyId, r.OrderId, r.TransferId, r.ReceiptDate ?? DateOnly.FromDateTime(DateTime.UtcNow), r.TotalQty, ct);
    }

    public async Task<PanelTransferReceiptDto> Handle(ReceivePanelTransferLegacyCommand command, CancellationToken ct)
    {
        var r = command.Request;
        return await ReceivePanelInternal(r.CompanyId, r.OrderId, r.TransferId, DateOnly.FromDateTime(DateTime.UtcNow), 0, ct);
    }

    private async Task<PanelTransferReceiptDto> ReceivePanelInternal(Guid companyId, Guid orderId, Guid transferId, DateOnly receiptDate, int totalQty, CancellationToken ct)
    {
        var existing = await uow.PanelReceipts.Query().FirstOrDefaultAsync(x => x.CuttingTransferId == transferId, ct);
        if (existing is not null) return mapper.Map<PanelTransferReceiptDto>(existing);

        var qty = totalQty > 0 ? totalQty : 1000;
        var entity = new PanelTransferReceipt
        {
            CompanyId = companyId,
            OrderId = orderId,
            CuttingTransferId = transferId,
            ReceiptNo = $"REC-{transferId:N}"[..20],
            ReceiptDate = receiptDate,
            TotalQty = qty,
            Status = PanelReceiptStatuses.Received,
        };
        await uow.PanelReceipts.AddAsync(entity, ct);
        await balances.AddPanelReceivedAsync(companyId, orderId, null, "MIXED", qty, ct);
        await uow.SaveChangesAsync(ct);
        await publisher.PublishAsync(new PanelTransferReceived(companyId, orderId, transferId, qty, receiptDate), ct);
        return mapper.Map<PanelTransferReceiptDto>(entity);
    }
}

public sealed class SewingQueryHandlers(IUnitOfWork uow, IMapper mapper) :
    IRequestHandler<GetSewingLinesQuery, IReadOnlyList<SewingLineDto>>,
    IRequestHandler<GetSewingLineByIdQuery, SewingLineDto>,
    IRequestHandler<GetProductionAssignmentsQuery, IReadOnlyList<ProductionAssignmentDto>>,
    IRequestHandler<GetProductionAssignmentByIdQuery, ProductionAssignmentDto>,
    IRequestHandler<GetProductionTargetsQuery, IReadOnlyList<ProductionTargetDto>>,
    IRequestHandler<GetDailyProductionRecordQuery, DailyProductionRecordDto?>,
    IRequestHandler<GetDailyReportQuery, IReadOnlyList<DailyReportRowDto>>,
    IRequestHandler<GetMonthlyReportQuery, IReadOnlyList<MonthlyReportRowDto>>,
    IRequestHandler<GetSewingOutputsQuery, IReadOnlyList<SewingOutputDto>>,
    IRequestHandler<GetSewingOutputByIdQuery, SewingOutputSnapshotDto>,
    IRequestHandler<GetSewingOutputQuantityQuery, int>,
    IRequestHandler<GetOrderSewingBalanceQuery, int>,
    IRequestHandler<GetSewingBalancesQuery, IReadOnlyList<SewingBalanceDto>>
{
    public async Task<IReadOnlyList<SewingLineDto>> Handle(GetSewingLinesQuery query, CancellationToken ct)
    {
        var rows = await uow.SewingLines.Query().Where(x => x.CompanyId == query.CompanyId)
            .OrderBy(x => x.SerialNo).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return mapper.Map<IReadOnlyList<SewingLineDto>>(rows);
    }

    public async Task<SewingLineDto> Handle(GetSewingLineByIdQuery query, CancellationToken ct)
    {
        var row = await uow.SewingLines.GetByIdAsync(query.Id, ct) ?? throw new KeyNotFoundException("Sewing line not found.");
        return mapper.Map<SewingLineDto>(row);
    }

    public async Task<IReadOnlyList<ProductionAssignmentDto>> Handle(GetProductionAssignmentsQuery query, CancellationToken ct)
    {
        var q = uow.Assignments.Query().Include(x => x.SewingLine).Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue) q = q.Where(x => x.OrderId == query.OrderId);
        var rows = await q.OrderByDescending(x => x.AssignDate).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return mapper.Map<IReadOnlyList<ProductionAssignmentDto>>(rows);
    }

    public async Task<ProductionAssignmentDto> Handle(GetProductionAssignmentByIdQuery query, CancellationToken ct)
    {
        var row = await uow.Assignments.Query().Include(x => x.SewingLine).FirstOrDefaultAsync(x => x.Id == query.Id, ct)
            ?? throw new KeyNotFoundException("Assignment not found.");
        return mapper.Map<ProductionAssignmentDto>(row);
    }

    public async Task<IReadOnlyList<ProductionTargetDto>> Handle(GetProductionTargetsQuery query, CancellationToken ct)
    {
        var q = uow.Targets.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.AssignmentId.HasValue) q = q.Where(x => x.AssignmentId == query.AssignmentId);
        if (query.Date.HasValue) q = q.Where(x => x.TargetDate == query.Date);
        return mapper.Map<IReadOnlyList<ProductionTargetDto>>(await q.ToListAsync(ct));
    }

    public async Task<DailyProductionRecordDto?> Handle(GetDailyProductionRecordQuery query, CancellationToken ct)
    {
        var row = await uow.DailyRecords.Query().FirstOrDefaultAsync(x => x.AssignmentId == query.AssignmentId && x.RecordDate == query.RecordDate, ct);
        return row is null ? null : mapper.Map<DailyProductionRecordDto>(row);
    }

    public async Task<IReadOnlyList<DailyReportRowDto>> Handle(GetDailyReportQuery query, CancellationToken ct)
    {
        var records = await uow.DailyRecords.Query()
            .Include(x => x.Assignment).ThenInclude(a => a!.SewingLine)
            .Where(x => x.CompanyId == query.CompanyId && x.RecordDate == query.Date)
            .Where(x => !query.LineId.HasValue || x.Assignment!.SewingLineId == query.LineId)
            .ToListAsync(ct);
        return records.Select(x => new DailyReportRowDto(
            x.AssignmentId,
            x.Assignment?.SewingLine?.LineName ?? "",
            x.Assignment?.StyleNo,
            x.Assignment?.BuyerName,
            x.DailyTarget,
            x.HourlyTarget,
            x.TotalCompleted,
            x.DailyTarget == 0 ? 0 : Math.Round((decimal)x.TotalCompleted / x.DailyTarget * 100, 2))).ToList();
    }

    public async Task<IReadOnlyList<MonthlyReportRowDto>> Handle(GetMonthlyReportQuery query, CancellationToken ct)
    {
        var from = new DateOnly(query.Year, query.Month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var records = await uow.DailyRecords.Query()
            .Include(x => x.Assignment).ThenInclude(a => a!.SewingLine)
            .Where(x => x.CompanyId == query.CompanyId && x.RecordDate >= from && x.RecordDate <= to)
            .Where(x => !query.LineId.HasValue || x.Assignment!.SewingLineId == query.LineId)
            .ToListAsync(ct);
        return records.GroupBy(x => x.Assignment!.SewingLine!.LineName).Select(g => new MonthlyReportRowDto(
            from.ToString("MMMM"),
            query.Year,
            g.Key,
            g.Sum(x => x.DailyTarget),
            g.Sum(x => x.TotalCompleted),
            g.Sum(x => x.DailyTarget) == 0 ? 0 : Math.Round((decimal)g.Sum(x => x.TotalCompleted) / g.Sum(x => x.DailyTarget) * 100, 2),
            g.Select(x => x.RecordDate).Distinct().Count(),
            g.GroupBy(x => x.Assignment!.StyleNo).OrderByDescending(s => s.Sum(r => r.TotalCompleted)).FirstOrDefault()?.Key)).ToList();
    }

    public async Task<IReadOnlyList<SewingOutputDto>> Handle(GetSewingOutputsQuery query, CancellationToken ct)
    {
        var q = uow.Outputs.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue) q = q.Where(x => x.OrderId == query.OrderId);
        var rows = await q.OrderByDescending(x => x.OutputDate).Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return mapper.Map<IReadOnlyList<SewingOutputDto>>(rows);
    }

    public async Task<SewingOutputSnapshotDto> Handle(GetSewingOutputByIdQuery query, CancellationToken ct)
    {
        var row = await uow.Outputs.Query().FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, ct)
            ?? throw new KeyNotFoundException("Output not found.");
        return mapper.Map<SewingOutputSnapshotDto>(row);
    }

    public async Task<int> Handle(GetSewingOutputQuantityQuery query, CancellationToken ct)
    {
        var color = string.IsNullOrWhiteSpace(query.Color) ? null : query.Color.Trim();
        var balance = await uow.Balances.Query().FirstOrDefaultAsync(x =>
            x.CompanyId == query.CompanyId && x.OrderId == query.OrderId && x.ColorName == color && x.SizeName == query.Size.Trim(), ct);
        return balance?.SewnOutputQty ?? 0;
    }

    public async Task<int> Handle(GetOrderSewingBalanceQuery query, CancellationToken ct) =>
        await uow.Balances.Query().Where(x => x.CompanyId == query.CompanyId && x.OrderId == query.OrderId)
            .SumAsync(x => x.WipQty, ct);

    public async Task<IReadOnlyList<SewingBalanceDto>> Handle(GetSewingBalancesQuery query, CancellationToken ct)
    {
        var q = uow.Balances.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue) q = q.Where(x => x.OrderId == query.OrderId);
        return mapper.Map<IReadOnlyList<SewingBalanceDto>>(await q.ToListAsync(ct));
    }
}
