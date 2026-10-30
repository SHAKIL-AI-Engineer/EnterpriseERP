using AutoMapper;
using FinishingService.Contracts;
using FinishingService.Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace FinishingService.Application.Handlers;

public sealed class FinishingCommandHandlers(
    IUnitOfWork uow,
    IFinishingDbContext db,
    IMapper mapper,
    IFinishingBalanceService balances,
    IProductionServiceClient production,
    IInventoryServiceClient inventory,
    IShipmentServiceClient shipment,
    IRedisCacheService cache,
    IReportExportClient exporter,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateFinishingReceiveCommand, FinishingReceiveDto>,
    IRequestHandler<ConfirmFinishingReceiveCommand, FinishingReceiveDto>,
    IRequestHandler<CancelFinishingReceiveCommand, FinishingReceiveDto>,
    IRequestHandler<CreateFinishingBatchCommand, FinishingBatchDto>,
    IRequestHandler<StartFinishingBatchCommand, FinishingBatchDto>,
    IRequestHandler<CompleteFinishingBatchCommand, FinishingBatchDto>,
    IRequestHandler<CancelFinishingBatchCommand, FinishingBatchDto>,
    IRequestHandler<CreateFinishingInputCommand, FinishingInputDto>,
    IRequestHandler<CreateIroningOutputCommand, IroningOutputDto>,
    IRequestHandler<CreateFinishingQCCommand, FinishingQCDto>,
    IRequestHandler<CreateFoldingPackingCommand, FoldingPackingDto>,
    IRequestHandler<CreateCartonPackingCommand, CartonPackingDto>,
    IRequestHandler<CloseCartonPackingCommand, CartonPackingDto>,
    IRequestHandler<CancelCartonPackingCommand, CartonPackingDto>,
    IRequestHandler<CreateFinishedGoodsTransferCommand, FinishedGoodsTransferDto>,
    IRequestHandler<ConfirmFinishedGoodsTransferCommand, FinishedGoodsTransferDto>,
    IRequestHandler<CancelFinishedGoodsTransferCommand, FinishedGoodsTransferDto>,
    IRequestHandler<CreateFinishingWastageCommand, FinishingWastageDto>,
    IRequestHandler<ExportFinishingReportCommand, ReportExportFile>
{
    // Receive Handlers
    public async Task<FinishingReceiveDto> Handle(CreateFinishingReceiveCommand command, CancellationToken ct)
    {
        var r = command.Request;
        if (await uow.FinishingReceives.Query().AnyAsync(x => x.CompanyId == r.CompanyId && x.ReceiveNo == r.ReceiveNo, ct))
            throw new InvalidOperationException("ReceiveNo already exists for this company.");

        if (r.ProductionOutputId.HasValue)
        {
            var sewing = await production.GetSewingOutputAsync(r.CompanyId, r.ProductionOutputId.Value, ct);
            if (sewing is null) throw new InvalidOperationException("Finishing receive must match an existing Sewing/Production output.");
        }

        var receive = new FinishingReceive
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            StyleId = r.StyleId,
            ProductionOutputId = r.ProductionOutputId,
            ReceiveNo = r.ReceiveNo.Trim(),
            ReceiveDate = r.ReceiveDate,
            FromDepartment = string.IsNullOrWhiteSpace(r.FromDepartment) ? "Sewing" : r.FromDepartment,
            Status = FinishingReceiveStatuses.Draft,
            CreatedBy = r.CreatedBy
        };

        receive.Items = r.Items.Select(x => new FinishingReceiveItem
        {
            CompanyId = r.CompanyId,
            OrderId = x.OrderId,
            BuyerPurchaseOrderId = x.BuyerPurchaseOrderId,
            ColorName = x.ColorName,
            SizeName = x.SizeName,
            ReceiveQty = x.ReceiveQty
        }).ToList();

        receive.TotalReceiveQty = receive.Items.Sum(x => x.ReceiveQty);

        await uow.FinishingReceives.AddAsync(receive, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Receive(receive.Id), ct);

        return mapper.Map<FinishingReceiveDto>(receive);
    }

    public async Task<FinishingReceiveDto> Handle(ConfirmFinishingReceiveCommand command, CancellationToken ct)
    {
        var receive = await db.FinishingReceives.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == command.Id, ct)
            ?? throw new KeyNotFoundException("Finishing receive not found.");

        if (receive.Status != FinishingReceiveStatuses.Draft)
            throw new InvalidOperationException("Only Draft receives can be confirmed.");

        receive.Status = FinishingReceiveStatuses.Confirmed;
        receive.ConfirmedAt = BusinessTime.Now;
        receive.ConfirmedBy = command.ConfirmedBy;

        db.Add(new FinishingAuditLog
        {
            CompanyId = receive.CompanyId,
            EntityName = nameof(FinishingReceive),
            EntityId = receive.Id,
            Action = "Confirmed",
            UserId = command.ConfirmedBy
        });

        await balances.UpdateReceiveQtyAsync(receive, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Receive(receive.Id), ct);
        await cache.RemoveAsync(CacheKeys.Balance(receive.CompanyId, receive.OrderId), ct);

        await publisher.PublishAsync(new FinishingReceiveConfirmed(
            receive.CompanyId, receive.OrderId, receive.Id, receive.ReceiveNo, receive.TotalReceiveQty, receive.ReceiveDate), ct);

        return mapper.Map<FinishingReceiveDto>(receive);
    }

    public async Task<FinishingReceiveDto> Handle(CancelFinishingReceiveCommand command, CancellationToken ct)
    {
        var receive = await db.FinishingReceives.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == command.Id, ct)
            ?? throw new KeyNotFoundException("Finishing receive not found.");

        if (receive.Status == FinishingReceiveStatuses.Cancelled)
            return mapper.Map<FinishingReceiveDto>(receive);

        receive.Status = FinishingReceiveStatuses.Cancelled;
        receive.UpdatedAt = BusinessTime.Now;
        receive.UpdatedBy = command.CancelledBy;

        db.Add(new FinishingAuditLog
        {
            CompanyId = receive.CompanyId,
            EntityName = nameof(FinishingReceive),
            EntityId = receive.Id,
            Action = "Cancelled",
            UserId = command.CancelledBy
        });

        await balances.UpdateReceiveQtyAsync(receive, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Receive(receive.Id), ct);
        await cache.RemoveAsync(CacheKeys.Balance(receive.CompanyId, receive.OrderId), ct);

        return mapper.Map<FinishingReceiveDto>(receive);
    }

    // Batch Handlers
    public async Task<FinishingBatchDto> Handle(CreateFinishingBatchCommand command, CancellationToken ct)
    {
        var r = command.Request;
        if (await uow.FinishingBatches.Query().AnyAsync(x => x.CompanyId == r.CompanyId && x.BatchNo == r.BatchNo, ct))
            throw new InvalidOperationException("BatchNo already exists for this company.");

        var batch = new FinishingBatch
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            StyleId = r.StyleId,
            BatchNo = r.BatchNo.Trim(),
            BatchDate = r.BatchDate,
            TotalInputQty = r.TotalInputQty,
            Status = FinishingBatchStatuses.Draft,
            CreatedBy = r.CreatedBy
        };

        await uow.FinishingBatches.AddAsync(batch, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Batch(batch.Id), ct);

        return mapper.Map<FinishingBatchDto>(batch);
    }

    public async Task<FinishingBatchDto> Handle(StartFinishingBatchCommand command, CancellationToken ct)
    {
        var batch = await uow.FinishingBatches.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException("Finishing batch not found.");

        if (batch.Status != FinishingBatchStatuses.Draft)
            throw new InvalidOperationException("Only Draft batches can be started.");

        batch.Status = FinishingBatchStatuses.Running;
        batch.StartedAt = BusinessTime.Now;
        batch.UpdatedBy = command.StartedBy;

        db.Add(new FinishingAuditLog
        {
            CompanyId = batch.CompanyId,
            EntityName = nameof(FinishingBatch),
            EntityId = batch.Id,
            Action = "Started",
            UserId = command.StartedBy
        });

        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Batch(batch.Id), ct);

        return mapper.Map<FinishingBatchDto>(batch);
    }

    public async Task<FinishingBatchDto> Handle(CompleteFinishingBatchCommand command, CancellationToken ct)
    {
        var batch = await uow.FinishingBatches.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException("Finishing batch not found.");

        if (batch.Status != FinishingBatchStatuses.Running)
            throw new InvalidOperationException("Only Running batches can be completed.");

        batch.Status = FinishingBatchStatuses.Completed;
        batch.CompletedAt = BusinessTime.Now;
        batch.UpdatedBy = command.CompletedBy;

        db.Add(new FinishingAuditLog
        {
            CompanyId = batch.CompanyId,
            EntityName = nameof(FinishingBatch),
            EntityId = batch.Id,
            Action = "Completed",
            UserId = command.CompletedBy
        });

        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Batch(batch.Id), ct);

        await publisher.PublishAsync(new FinishingCompleted(batch.CompanyId, batch.OrderId, batch.Id, batch.CompletedAt.Value), ct);

        return mapper.Map<FinishingBatchDto>(batch);
    }

    public async Task<FinishingBatchDto> Handle(CancelFinishingBatchCommand command, CancellationToken ct)
    {
        var batch = await uow.FinishingBatches.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException("Finishing batch not found.");

        EnsureBatchNotCompleted(batch);

        batch.Status = FinishingBatchStatuses.Cancelled;
        batch.UpdatedAt = BusinessTime.Now;
        batch.UpdatedBy = command.CancelledBy;

        db.Add(new FinishingAuditLog
        {
            CompanyId = batch.CompanyId,
            EntityName = nameof(FinishingBatch),
            EntityId = batch.Id,
            Action = "Cancelled",
            UserId = command.CancelledBy
        });

        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Batch(batch.Id), ct);

        return mapper.Map<FinishingBatchDto>(batch);
    }

    // Finishing Input
    public async Task<FinishingInputDto> Handle(CreateFinishingInputCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var batch = await uow.FinishingBatches.GetByIdAsync(r.FinishingBatchId, ct)
            ?? throw new KeyNotFoundException("Finishing batch not found.");

        EnsureBatchNotCompleted(batch);

        var balance = await db.FinishingBalances.FirstOrDefaultAsync(x =>
            x.CompanyId == r.CompanyId && x.OrderId == r.OrderId && x.ColorName == r.ColorName && x.SizeName == r.SizeName, ct);

        var remainingReceive = (balance?.FinishingReceiveQty ?? 0) - (balance?.FinishingInputQty ?? 0);
        if (r.InputQty > remainingReceive)
            throw new InvalidOperationException($"Finishing input qty ({r.InputQty}) cannot exceed finishing received balance ({remainingReceive}).");

        var input = new FinishingInput
        {
            CompanyId = r.CompanyId,
            FinishingBatchId = r.FinishingBatchId,
            OrderId = r.OrderId,
            InputDate = r.InputDate,
            ColorName = r.ColorName,
            SizeName = r.SizeName,
            InputQty = r.InputQty,
            CreatedBy = r.CreatedBy
        };

        await uow.FinishingInputs.AddAsync(input, ct);
        await balances.UpdateInputQtyAsync(input, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Balance(r.CompanyId, r.OrderId), ct);

        await publisher.PublishAsync(new FinishingInputCreated(
            input.CompanyId, input.OrderId, input.FinishingBatchId, input.ColorName, input.SizeName, input.InputQty, input.InputDate), ct);

        return mapper.Map<FinishingInputDto>(input);
    }

    // Ironing Output
    public async Task<IroningOutputDto> Handle(CreateIroningOutputCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var batch = await uow.FinishingBatches.GetByIdAsync(r.FinishingBatchId, ct)
            ?? throw new KeyNotFoundException("Finishing batch not found.");

        EnsureBatchNotCompleted(batch);

        var balance = await db.FinishingBalances.FirstOrDefaultAsync(x =>
            x.CompanyId == r.CompanyId && x.OrderId == r.OrderId && x.ColorName == r.ColorName && x.SizeName == r.SizeName, ct);

        var remainingInput = (balance?.FinishingInputQty ?? 0) - (balance?.IronQty ?? 0);
        if (r.IronQty > remainingInput)
            throw new InvalidOperationException($"Ironing output qty ({r.IronQty}) cannot exceed finishing input balance ({remainingInput}).");

        var ironing = new IroningOutput
        {
            CompanyId = r.CompanyId,
            FinishingBatchId = r.FinishingBatchId,
            OrderId = r.OrderId,
            OutputDate = r.OutputDate,
            ColorName = r.ColorName,
            SizeName = r.SizeName,
            IronQty = r.IronQty,
            ReIronQty = r.ReIronQty,
            CreatedBy = r.CreatedBy
        };

        await uow.IroningOutputs.AddAsync(ironing, ct);
        await balances.UpdateIronQtyAsync(ironing, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Balance(r.CompanyId, r.OrderId), ct);

        await publisher.PublishAsync(new IroningOutputCreated(
            ironing.CompanyId, ironing.OrderId, ironing.FinishingBatchId, ironing.ColorName, ironing.SizeName, ironing.IronQty, ironing.OutputDate), ct);

        return mapper.Map<IroningOutputDto>(ironing);
    }

    // Finishing QC
    public async Task<FinishingQCDto> Handle(CreateFinishingQCCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var batch = await uow.FinishingBatches.GetByIdAsync(r.FinishingBatchId, ct)
            ?? throw new KeyNotFoundException("Finishing batch not found.");

        EnsureBatchNotCompleted(batch);

        if (r.PassedQty + r.AlterQty + r.RejectQty > r.CheckedQty)
            throw new InvalidOperationException("PassedQty + AlterQty + RejectQty cannot exceed CheckedQty.");

        if ((r.AlterQty > 0 || r.RejectQty > 0) && !r.Defects.Any())
            throw new InvalidOperationException("Rejection/alter output requires a defect reason.");

        var balance = await db.FinishingBalances.FirstOrDefaultAsync(x =>
            x.CompanyId == r.CompanyId && x.OrderId == r.OrderId && x.ColorName == r.ColorName && x.SizeName == r.SizeName, ct);

        var totalChecked = await db.FinishingQCs
            .Where(x => x.CompanyId == r.CompanyId && x.OrderId == r.OrderId && x.ColorName == r.ColorName && x.SizeName == r.SizeName)
            .SumAsync(x => x.CheckedQty, ct);

        var remainingIron = (balance?.IronQty ?? 0) - totalChecked;
        if (r.CheckedQty > remainingIron)
            throw new InvalidOperationException($"QC checked quantity ({r.CheckedQty}) cannot exceed ironing output balance ({remainingIron}).");

        var qc = new FinishingQC
        {
            CompanyId = r.CompanyId,
            FinishingBatchId = r.FinishingBatchId,
            OrderId = r.OrderId,
            QCDate = r.QCDate,
            ColorName = r.ColorName,
            SizeName = r.SizeName,
            CheckedQty = r.CheckedQty,
            PassedQty = r.PassedQty,
            AlterQty = r.AlterQty,
            RejectQty = r.RejectQty,
            DefectQty = r.Defects.Sum(x => x.DefectQty),
            CreatedBy = r.CreatedBy
        };

        qc.Defects = r.Defects.Select(x => new FinishingDefect
        {
            CompanyId = r.CompanyId,
            DefectType = x.DefectType,
            DefectQty = x.DefectQty,
            Remarks = x.Remarks
        }).ToList();

        await uow.FinishingQCs.AddAsync(qc, ct);
        await balances.UpdateQCQtyAsync(qc, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Balance(r.CompanyId, r.OrderId), ct);

        await publisher.PublishAsync(new FinishingQCCreated(
            qc.CompanyId, qc.OrderId, qc.FinishingBatchId, qc.ColorName, qc.SizeName, qc.PassedQty, qc.AlterQty, qc.RejectQty, qc.QCDate), ct);

        return mapper.Map<FinishingQCDto>(qc);
    }

    // Folding & Packing
    public async Task<FoldingPackingDto> Handle(CreateFoldingPackingCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var batch = await uow.FinishingBatches.GetByIdAsync(r.FinishingBatchId, ct)
            ?? throw new KeyNotFoundException("Finishing batch not found.");

        EnsureBatchNotCompleted(batch);

        var balance = await db.FinishingBalances.FirstOrDefaultAsync(x =>
            x.CompanyId == r.CompanyId && x.OrderId == r.OrderId && x.ColorName == r.ColorName && x.SizeName == r.SizeName, ct);

        var remainingQCPass = (balance?.QCPassQty ?? 0) - (balance?.FoldingQty ?? 0);
        if (r.FoldingQty > remainingQCPass)
            throw new InvalidOperationException($"FoldingQty ({r.FoldingQty}) cannot exceed QC passed balance ({remainingQCPass}).");

        if (r.PolyQty > r.FoldingQty)
            throw new InvalidOperationException("PolyQty cannot exceed FoldingQty on the current transaction.");

        var remainingFolding = (balance?.FoldingQty ?? 0) - (balance?.PolyQty ?? 0);
        if (r.PolyQty > remainingFolding + r.FoldingQty)
            throw new InvalidOperationException("Cumulative PolyQty cannot exceed cumulative FoldingQty.");

        var folding = new FoldingPacking
        {
            CompanyId = r.CompanyId,
            FinishingBatchId = r.FinishingBatchId,
            OrderId = r.OrderId,
            PackingDate = r.PackingDate,
            ColorName = r.ColorName,
            SizeName = r.SizeName,
            FoldingQty = r.FoldingQty,
            TaggingQty = r.TaggingQty,
            PolyQty = r.PolyQty,
            CreatedBy = r.CreatedBy
        };

        await uow.FoldingPackings.AddAsync(folding, ct);
        await balances.UpdateFoldingQtyAsync(folding, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Balance(r.CompanyId, r.OrderId), ct);

        return mapper.Map<FoldingPackingDto>(folding);
    }

    // Carton Packing Handlers
    public async Task<CartonPackingDto> Handle(CreateCartonPackingCommand command, CancellationToken ct)
    {
        var r = command.Request;
        if (await uow.CartonPackings.Query().AnyAsync(x => x.CompanyId == r.CompanyId && x.CartonNo == r.CartonNo, ct))
            throw new InvalidOperationException("CartonNo already exists for this company.");

        foreach (var item in r.Items)
        {
            var balance = await db.FinishingBalances.FirstOrDefaultAsync(x =>
                x.CompanyId == r.CompanyId && x.OrderId == item.OrderId && x.ColorName == item.ColorName && x.SizeName == item.SizeName, ct);

            var remainingPoly = (balance?.PolyQty ?? 0) - (balance?.CartonQty ?? 0);
            if (item.Quantity > remainingPoly)
                throw new InvalidOperationException($"Carton packing quantity ({item.Quantity}) for color/size ({item.ColorName}/{item.SizeName}) cannot exceed Poly packing balance ({remainingPoly}).");
        }

        var carton = new CartonPacking
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            BuyerPurchaseOrderId = r.BuyerPurchaseOrderId,
            CartonNo = r.CartonNo.Trim(),
            PackingDate = r.PackingDate,
            CartonType = r.CartonType,
            GrossWeight = r.GrossWeight,
            NetWeight = r.NetWeight,
            CBM = r.CBM,
            Status = CartonPackingStatuses.Open,
            CreatedBy = r.CreatedBy
        };

        carton.Items = r.Items.Select(x => new CartonPackingItem
        {
            CompanyId = r.CompanyId,
            OrderId = x.OrderId,
            BuyerPurchaseOrderId = x.BuyerPurchaseOrderId,
            ColorName = x.ColorName,
            SizeName = x.SizeName,
            Quantity = x.Quantity
        }).ToList();

        await uow.CartonPackings.AddAsync(carton, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Carton(carton.Id), ct);

        return mapper.Map<CartonPackingDto>(carton);
    }

    public async Task<CartonPackingDto> Handle(CloseCartonPackingCommand command, CancellationToken ct)
    {
        var carton = await db.CartonPackings.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == command.Id, ct)
            ?? throw new KeyNotFoundException("Carton packing not found.");

        if (carton.Status != CartonPackingStatuses.Open)
            throw new InvalidOperationException("Only Open cartons can be closed.");

        carton.Status = CartonPackingStatuses.Closed;
        carton.ClosedAt = BusinessTime.Now;
        carton.UpdatedBy = command.ClosedBy;

        db.Add(new FinishingAuditLog
        {
            CompanyId = carton.CompanyId,
            EntityName = nameof(CartonPacking),
            EntityId = carton.Id,
            Action = "Closed",
            UserId = command.ClosedBy
        });

        await balances.UpdateCartonQtyAsync(carton, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Carton(carton.Id), ct);
        await cache.RemoveAsync(CacheKeys.Balance(carton.CompanyId, carton.OrderId), ct);

        await publisher.PublishAsync(new CartonPacked(
            carton.CompanyId, carton.OrderId, carton.Id, carton.CartonNo, carton.Items.Sum(x => x.Quantity), carton.PackingDate), ct);

        return mapper.Map<CartonPackingDto>(carton);
    }

    public async Task<CartonPackingDto> Handle(CancelCartonPackingCommand command, CancellationToken ct)
    {
        var carton = await db.CartonPackings.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == command.Id, ct)
            ?? throw new KeyNotFoundException("Carton packing not found.");

        if (carton.Status == CartonPackingStatuses.Transferred)
            throw new InvalidOperationException("Transferred cartons cannot be cancelled.");

        carton.Status = CartonPackingStatuses.Cancelled;
        carton.UpdatedAt = BusinessTime.Now;
        carton.UpdatedBy = command.CancelledBy;

        db.Add(new FinishingAuditLog
        {
            CompanyId = carton.CompanyId,
            EntityName = nameof(CartonPacking),
            EntityId = carton.Id,
            Action = "Cancelled",
            UserId = command.CancelledBy
        });

        await balances.UpdateCartonQtyAsync(carton, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Carton(carton.Id), ct);
        await cache.RemoveAsync(CacheKeys.Balance(carton.CompanyId, carton.OrderId), ct);

        return mapper.Map<CartonPackingDto>(carton);
    }

    // Finished Goods Transfer Handlers
    public async Task<FinishedGoodsTransferDto> Handle(CreateFinishedGoodsTransferCommand command, CancellationToken ct)
    {
        var r = command.Request;
        if (await uow.FinishedGoodsTransfers.Query().AnyAsync(x => x.CompanyId == r.CompanyId && x.TransferNo == r.TransferNo, ct))
            throw new InvalidOperationException("TransferNo already exists for this company.");

        foreach (var item in r.Items)
        {
            var balance = await db.FinishingBalances.FirstOrDefaultAsync(x =>
                x.CompanyId == r.CompanyId && x.OrderId == item.OrderId && x.ColorName == item.ColorName && x.SizeName == item.SizeName, ct);

            var remainingCarton = (balance?.CartonQty ?? 0) - (balance?.TransferQty ?? 0);
            if (item.TransferQty > remainingCarton)
                throw new InvalidOperationException($"Transfer quantity ({item.TransferQty}) for color/size ({item.ColorName}/{item.SizeName}) cannot exceed Carton closed balance ({remainingCarton}).");
        }

        var transfer = new FinishedGoodsTransfer
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            TransferNo = r.TransferNo.Trim(),
            TransferDate = r.TransferDate,
            ToWarehouseId = r.ToWarehouseId,
            ToDepartment = string.IsNullOrWhiteSpace(r.ToDepartment) ? "FinishedGoods" : r.ToDepartment,
            Status = FinishedGoodsTransferStatuses.Draft,
            CreatedBy = r.CreatedBy
        };

        transfer.Items = r.Items.Select(x => new FinishedGoodsTransferItem
        {
            CompanyId = r.CompanyId,
            CartonPackingId = x.CartonPackingId,
            OrderId = x.OrderId,
            BuyerPurchaseOrderId = x.BuyerPurchaseOrderId,
            ColorName = x.ColorName,
            SizeName = x.SizeName,
            TransferQty = x.TransferQty
        }).ToList();

        transfer.TotalTransferQty = transfer.Items.Sum(x => x.TransferQty);

        await uow.FinishedGoodsTransfers.AddAsync(transfer, ct);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<FinishedGoodsTransferDto>(transfer);
    }

    public async Task<FinishedGoodsTransferDto> Handle(ConfirmFinishedGoodsTransferCommand command, CancellationToken ct)
    {
        var transfer = await db.FinishedGoodsTransfers.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == command.Id, ct)
            ?? throw new KeyNotFoundException("Finished goods transfer not found.");

        if (transfer.Status != FinishedGoodsTransferStatuses.Draft)
            throw new InvalidOperationException("Only Draft transfers can be confirmed.");

        transfer.Status = FinishedGoodsTransferStatuses.Confirmed;
        transfer.ConfirmedAt = BusinessTime.Now;
        transfer.ConfirmedBy = command.ConfirmedBy;

        db.Add(new FinishingAuditLog
        {
            CompanyId = transfer.CompanyId,
            EntityName = nameof(FinishedGoodsTransfer),
            EntityId = transfer.Id,
            Action = "Confirmed",
            UserId = command.ConfirmedBy
        });

        // Set linked cartons to Transferred
        var cartonIds = transfer.Items.Where(x => x.CartonPackingId.HasValue).Select(x => x.CartonPackingId!.Value).Distinct().ToList();
        if (cartonIds.Any())
        {
            var cartons = await db.CartonPackings.Where(x => cartonIds.Contains(x.Id)).ToListAsync(ct);
            foreach (var carton in cartons)
            {
                carton.Status = CartonPackingStatuses.Transferred;
                carton.UpdatedAt = BusinessTime.Now;
            }
        }

        await balances.UpdateTransferQtyAsync(transfer, ct);
        await uow.SaveChangesAsync(ct);

        // Integrate with inventory service
        await inventory.CreateFinishedGoodsReceiveAsync(transfer.CompanyId, transfer.Id, ct);

        // Integrate with shipment service
        await shipment.NotifyFinishedGoodsReadyAsync(transfer.CompanyId, transfer.OrderId, transfer.Id, ct);

        // Clear balance cache
        await cache.RemoveAsync(CacheKeys.Balance(transfer.CompanyId, transfer.OrderId), ct);

        // Publish event
        await publisher.PublishAsync(new FinishedGoodsTransferred(
            transfer.CompanyId, transfer.OrderId, transfer.Id, transfer.TransferNo, transfer.TotalTransferQty, transfer.TransferDate), ct);

        return mapper.Map<FinishedGoodsTransferDto>(transfer);
    }

    public async Task<FinishedGoodsTransferDto> Handle(CancelFinishedGoodsTransferCommand command, CancellationToken ct)
    {
        var transfer = await db.FinishedGoodsTransfers.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == command.Id, ct)
            ?? throw new KeyNotFoundException("Finished goods transfer not found.");

        if (transfer.Status == FinishedGoodsTransferStatuses.Confirmed)
            throw new InvalidOperationException("Confirmed transfers cannot be cancelled.");

        transfer.Status = FinishedGoodsTransferStatuses.Cancelled;
        transfer.UpdatedAt = BusinessTime.Now;
        transfer.UpdatedBy = command.CancelledBy;

        db.Add(new FinishingAuditLog
        {
            CompanyId = transfer.CompanyId,
            EntityName = nameof(FinishedGoodsTransfer),
            EntityId = transfer.Id,
            Action = "Cancelled",
            UserId = command.CancelledBy
        });

        await balances.UpdateTransferQtyAsync(transfer, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Balance(transfer.CompanyId, transfer.OrderId), ct);

        return mapper.Map<FinishedGoodsTransferDto>(transfer);
    }

    // Wastage Handler
    public async Task<FinishingWastageDto> Handle(CreateFinishingWastageCommand command, CancellationToken ct)
    {
        var r = command.Request;
        if (string.IsNullOrWhiteSpace(r.WastageReason))
            throw new InvalidOperationException("Finishing wastage requires a wastage reason.");

        var wastage = new FinishingWastage
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            FinishingBatchId = r.FinishingBatchId,
            WastageDate = r.WastageDate,
            ColorName = r.ColorName,
            SizeName = r.SizeName,
            WastageQty = r.WastageQty,
            WastageReason = r.WastageReason.Trim(),
            CreatedBy = r.CreatedBy
        };

        await uow.FinishingWastages.AddAsync(wastage, ct);
        await balances.UpdateWastageQtyAsync(wastage, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Balance(r.CompanyId, r.OrderId), ct);

        await publisher.PublishAsync(new FinishingWastageCreated(
            wastage.CompanyId, wastage.OrderId, wastage.FinishingBatchId, wastage.WastageQty, wastage.WastageReason, wastage.WastageDate), ct);

        return mapper.Map<FinishingWastageDto>(wastage);
    }

    // Report Export Handler
    public async Task<ReportExportFile> Handle(ExportFinishingReportCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var data = await db.FinishingQCs.Where(x => x.CompanyId == r.CompanyId).ToListAsync(ct); // Default logic or resolve through mediator
        
        var columns = new[] { "ReportType", "CompanyId", "OrderId", "ReferenceNo", "Date", "Color", "Size", "Quantity", "WastageQty", "Status" };
        var rows = new List<IReadOnlyList<string>>();

        // Perform in-memory mapping to report matrix
        var reportTitle = $"Finishing {r.ReportType} Report";
        
        // Return dummy bytes to signify standard call matching Cutting reports
        var exportRows = new List<IReadOnlyList<string>>
        {
            new[] { r.ReportType, r.CompanyId.ToString(), r.OrderId?.ToString() ?? "", "REF-TEST", DateTime.Today.ToString("yyyy-MM-dd"), "Black", "M", "500", "0", "Draft" }
        };

        return await exporter.ExportAsync(reportTitle, r.Format, columns, exportRows, command.BearerToken, ct);
    }

    private static void EnsureBatchNotCompleted(FinishingBatch batch)
    {
        if (batch.Status == FinishingBatchStatuses.Completed)
            throw new InvalidOperationException("Completed finishing batches cannot be edited.");
    }
}

internal static class CacheKeys
{
    public static string Receive(Guid id) => $"finishing:receive:{id}";
    public static string Batch(Guid id) => $"finishing:batch:{id}";
    public static string Carton(Guid id) => $"finishing:carton:{id}";
    public static string Balance(Guid companyId, Guid orderId) => $"finishing:balance:{companyId}:{orderId}";
}
