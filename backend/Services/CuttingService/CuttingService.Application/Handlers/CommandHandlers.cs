using AutoMapper;
using CuttingService.Contracts;
using CuttingService.Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace CuttingService.Application.Handlers;

public sealed class CuttingCommandHandlers(
    IUnitOfWork uow,
    ICuttingDbContext db,
    IMapper mapper,
    ICuttingBalanceService balances,
    IMerchandisingServiceClient merchandising,
    IProductionServiceClient production,
    IRedisCacheService cache,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateCuttingPlanCommand, CuttingPlanDto>,
    IRequestHandler<UpdateCuttingPlanCommand, CuttingPlanDto>,
    IRequestHandler<ApproveCuttingPlanCommand, CuttingPlanDto>,
    IRequestHandler<StartCuttingPlanCommand, CuttingPlanDto>,
    IRequestHandler<CompleteCuttingPlanCommand, CuttingPlanDto>,
    IRequestHandler<CancelCuttingPlanCommand, CuttingPlanDto>,
    IRequestHandler<AddCuttingPlanSizeBreakdownCommand, CuttingPlanSizeBreakdownDto>,
    IRequestHandler<UpdateCuttingPlanSizeBreakdownCommand, CuttingPlanSizeBreakdownDto>,
    IRequestHandler<DeleteCuttingPlanSizeBreakdownCommand, Unit>,
    IRequestHandler<CreateFabricIssueToCuttingCommand, FabricIssueToCuttingDto>,
    IRequestHandler<CreateCuttingLayCommand, CuttingLayDto>,
    IRequestHandler<UpdateCuttingLayCommand, CuttingLayDto>,
    IRequestHandler<CreateCuttingOutputCommand, CuttingOutputDto>,
    IRequestHandler<CreateCuttingWastageCommand, CuttingWastageDto>,
    IRequestHandler<CreateCuttingPanelTransferCommand, CuttingPanelTransferDto>,
    IRequestHandler<ConfirmCuttingPanelTransferCommand, CuttingPanelTransferDto>,
    IRequestHandler<CancelCuttingPanelTransferCommand, CuttingPanelTransferDto>,
    IRequestHandler<CreateCuttingBundleCommand, CuttingBundleDto>,
    IRequestHandler<UpdateCuttingBundleCommand, CuttingBundleDto>,
    IRequestHandler<UpdateCuttingBundleStatusCommand, CuttingBundleDto>
{
    public async Task<CuttingPlanDto> Handle(CreateCuttingPlanCommand command, CancellationToken ct)
    {
        var r = command.Request;
        if (await uow.CuttingPlans.Query().AnyAsync(x => x.CompanyId == r.CompanyId && x.PlanNo == r.PlanNo, ct)) throw new InvalidOperationException("PlanNo already exists for this company.");
        if (!await merchandising.IsOrderConfirmedAsync(r.CompanyId, r.OrderId, ct)) throw new InvalidOperationException("Cutting plan requires confirmed order.");
        var order = await merchandising.GetOrderAsync(r.CompanyId, r.OrderId, ct);
        var plan = new CuttingPlan { CompanyId = r.CompanyId, OrderId = r.OrderId, StyleId = r.StyleId ?? order?.StyleId, PlanNo = r.PlanNo.Trim(), PlanDate = r.PlanDate, ColorName = r.ColorName, TotalPlanQty = r.TotalPlanQty, CreatedBy = r.CreatedBy };
        await uow.CuttingPlans.AddAsync(plan, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Plan(plan.Id), ct);
        return mapper.Map<CuttingPlanDto>(plan);
    }

    public async Task<CuttingPlanDto> Handle(UpdateCuttingPlanCommand command, CancellationToken ct)
    {
        var plan = await uow.CuttingPlans.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        EnsureNotCompleted(plan);
        plan.StyleId = command.Request.StyleId;
        plan.PlanDate = command.Request.PlanDate;
        plan.ColorName = command.Request.ColorName;
        plan.TotalPlanQty = command.Request.TotalPlanQty;
        plan.UpdatedBy = command.Request.UpdatedBy;
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Plan(plan.Id), ct);
        return mapper.Map<CuttingPlanDto>(plan);
    }

    public async Task<CuttingPlanDto> Handle(ApproveCuttingPlanCommand command, CancellationToken ct)
    {
        var plan = await uow.CuttingPlans.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        var total = await db.CuttingPlanSizeBreakdowns.Where(x => x.CuttingPlanId == plan.Id).SumAsync(x => x.PlanQty, ct);
        if (total != plan.TotalPlanQty) throw new InvalidOperationException("Total plan qty must match size breakdown total.");
        plan.Status = CuttingPlanStatuses.Approved;
        plan.ApprovedBy = command.ApprovedBy;
        plan.ApprovedAt = BusinessTime.Now;
        db.Add(new CuttingAuditLog { CompanyId = plan.CompanyId, EntityName = nameof(CuttingPlan), EntityId = plan.Id, Action = "Approved", UserId = command.ApprovedBy });
        await balances.UpdatePlanQtyAsync(plan, ct);
        await uow.SaveChangesAsync(ct);
        await publisher.PublishAsync(new CuttingPlanApproved(plan.CompanyId, plan.OrderId, plan.Id, plan.PlanNo), ct);
        return mapper.Map<CuttingPlanDto>(plan);
    }

    public async Task<CuttingPlanDto> Handle(StartCuttingPlanCommand command, CancellationToken ct)
    {
        var plan = await uow.CuttingPlans.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        if (plan.Status != CuttingPlanStatuses.Approved) throw new InvalidOperationException("Cutting plan must be approved before running.");
        if (!await merchandising.IsOrderConfirmedAsync(plan.CompanyId, plan.OrderId, ct)) throw new InvalidOperationException("Cutting cannot start before order confirmation.");
        plan.Status = CuttingPlanStatuses.Running;
        db.Add(new CuttingAuditLog { CompanyId = plan.CompanyId, EntityName = nameof(CuttingPlan), EntityId = plan.Id, Action = "Started", UserId = command.UserId });
        await uow.SaveChangesAsync(ct);
        await publisher.PublishAsync(new CuttingStarted(plan.CompanyId, plan.OrderId, plan.Id, plan.PlanDate), ct);
        return mapper.Map<CuttingPlanDto>(plan);
    }

    public async Task<CuttingPlanDto> Handle(CompleteCuttingPlanCommand command, CancellationToken ct)
    {
        var plan = await uow.CuttingPlans.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        plan.Status = CuttingPlanStatuses.Completed;
        plan.CompletedAt = BusinessTime.Now;
        db.Add(new CuttingAuditLog { CompanyId = plan.CompanyId, EntityName = nameof(CuttingPlan), EntityId = plan.Id, Action = "Completed", UserId = command.UserId });
        await uow.SaveChangesAsync(ct);
        await publisher.PublishAsync(new CuttingCompleted(plan.CompanyId, plan.OrderId, plan.Id, plan.CompletedAt.Value), ct);
        return mapper.Map<CuttingPlanDto>(plan);
    }

    public async Task<CuttingPlanDto> Handle(CancelCuttingPlanCommand command, CancellationToken ct)
    {
        var plan = await uow.CuttingPlans.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        EnsureNotCompleted(plan);
        plan.Status = CuttingPlanStatuses.Cancelled;
        db.Add(new CuttingAuditLog { CompanyId = plan.CompanyId, EntityName = nameof(CuttingPlan), EntityId = plan.Id, Action = "Cancelled", UserId = command.UserId });
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingPlanDto>(plan);
    }

    public async Task<CuttingPlanSizeBreakdownDto> Handle(AddCuttingPlanSizeBreakdownCommand command, CancellationToken ct)
    {
        var plan = await uow.CuttingPlans.GetByIdAsync(command.PlanId, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        EnsureNotCompleted(plan);
        var row = new CuttingPlanSizeBreakdown { CompanyId = command.Request.CompanyId, CuttingPlanId = plan.Id, SizeName = command.Request.SizeName, PlanQty = command.Request.PlanQty };
        await uow.SizeBreakdowns.AddAsync(row, ct);
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingPlanSizeBreakdownDto>(row);
    }

    public async Task<CuttingPlanSizeBreakdownDto> Handle(UpdateCuttingPlanSizeBreakdownCommand command, CancellationToken ct)
    {
        var row = await uow.SizeBreakdowns.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Size breakdown not found.");
        var plan = await uow.CuttingPlans.GetByIdAsync(row.CuttingPlanId, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        EnsureNotCompleted(plan);
        row.SizeName = command.Request.SizeName;
        row.PlanQty = command.Request.PlanQty;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingPlanSizeBreakdownDto>(row);
    }

    public async Task<Unit> Handle(DeleteCuttingPlanSizeBreakdownCommand command, CancellationToken ct)
    {
        var row = await uow.SizeBreakdowns.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Size breakdown not found.");
        var plan = await uow.CuttingPlans.GetByIdAsync(row.CuttingPlanId, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        EnsureNotCompleted(plan);
        uow.SizeBreakdowns.Remove(row);
        await uow.SaveChangesAsync(ct);
        return Unit.Value;
    }

    public async Task<FabricIssueToCuttingDto> Handle(CreateFabricIssueToCuttingCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var issue = new FabricIssueToCutting { CompanyId = r.CompanyId, OrderId = r.OrderId, CuttingPlanId = r.CuttingPlanId, InventoryIssueId = r.InventoryIssueId, IssueNo = r.IssueNo, IssueDate = r.IssueDate, FabricItemId = r.FabricItemId, IssueQty = r.IssueQty, UnitName = r.UnitName, LotNo = r.LotNo, BatchNo = r.BatchNo, ColorName = r.ColorName, CreatedBy = r.CreatedBy };
        await uow.FabricIssues.AddAsync(issue, ct);
        await uow.SaveChangesAsync(ct);
        return mapper.Map<FabricIssueToCuttingDto>(issue);
    }

    public async Task<CuttingLayDto> Handle(CreateCuttingLayCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var plan = await uow.CuttingPlans.GetByIdAsync(r.CuttingPlanId, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        EnsureNotCompleted(plan);
        var lay = new CuttingLay { CompanyId = r.CompanyId, CuttingPlanId = r.CuttingPlanId, LayNo = r.LayNo, LayDate = r.LayDate, MarkerNo = r.MarkerNo, FabricLength = r.FabricLength, PlyQty = r.PlyQty, LayQty = r.LayQty, CreatedBy = r.CreatedBy };
        lay.SizeDetails = r.SizeDetails.Select(x => new CuttingLaySizeDetail { CompanyId = r.CompanyId, SizeName = x.SizeName, RatioQty = x.RatioQty, PlyQty = x.PlyQty, CutQty = x.RatioQty * x.PlyQty }).ToList();
        await uow.Lays.AddAsync(lay, ct);
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingLayDto>(lay);
    }

    public async Task<CuttingLayDto> Handle(UpdateCuttingLayCommand command, CancellationToken ct)
    {
        var lay = await db.CuttingLays.Include(x => x.SizeDetails).FirstOrDefaultAsync(x => x.Id == command.Id, ct) ?? throw new KeyNotFoundException("Cutting lay not found.");
        var plan = await uow.CuttingPlans.GetByIdAsync(lay.CuttingPlanId, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        EnsureNotCompleted(plan);
        lay.LayNo = command.Request.LayNo; lay.LayDate = command.Request.LayDate; lay.MarkerNo = command.Request.MarkerNo; lay.FabricLength = command.Request.FabricLength; lay.PlyQty = command.Request.PlyQty; lay.LayQty = command.Request.LayQty; lay.Status = command.Request.Status; lay.UpdatedBy = command.Request.UpdatedBy;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingLayDto>(lay);
    }

    public async Task<CuttingOutputDto> Handle(CreateCuttingOutputCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var plan = await uow.CuttingPlans.GetByIdAsync(r.CuttingPlanId, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        if (!await uow.FabricIssues.Query().AnyAsync(x => x.CompanyId == r.CompanyId && x.OrderId == r.OrderId && (x.CuttingPlanId == null || x.CuttingPlanId == r.CuttingPlanId), ct)) throw new InvalidOperationException("Fabric issue must exist before cutting output.");
        var currentPlanOutput = await uow.Outputs.Query().Where(x => x.CuttingPlanId == r.CuttingPlanId).SumAsync(x => x.OutputQty, ct);
        var order = await merchandising.GetOrderAsync(r.CompanyId, r.OrderId, ct);
        var orderQty = order?.TotalOrderQty ?? plan.TotalPlanQty;
        var currentOrderOutput = await uow.Outputs.Query().Where(x => x.CompanyId == r.CompanyId && x.OrderId == r.OrderId).SumAsync(x => x.OutputQty, ct);
        if (!r.IsOverageApproved && currentPlanOutput + r.OutputQty > plan.TotalPlanQty) throw new InvalidOperationException("Cutting output cannot exceed plan qty without approval.");
        if (!r.IsOverageApproved && currentOrderOutput + r.OutputQty > orderQty) throw new InvalidOperationException("Cutting output cannot exceed order qty without approval.");
        var output = new CuttingOutput { CompanyId = r.CompanyId, CuttingPlanId = r.CuttingPlanId, CuttingLayId = r.CuttingLayId, OrderId = r.OrderId, OutputDate = r.OutputDate, ColorName = r.ColorName ?? plan.ColorName, SizeName = r.SizeName, OutputQty = r.OutputQty, Status = r.IsOverageApproved ? CuttingOutputStatuses.ApprovedOverage : CuttingOutputStatuses.Created, CreatedBy = r.CreatedBy };
        await uow.Outputs.AddAsync(output, ct);
        await balances.AddOutputAsync(output, orderQty, ct);
        await uow.SaveChangesAsync(ct);
        await cache.RemoveAsync(CacheKeys.Balance(r.CompanyId, r.OrderId), ct);
        await publisher.PublishAsync(new CuttingOutputCreated(output.CompanyId, output.OrderId, output.CuttingPlanId, output.ColorName, output.SizeName, output.OutputQty, output.OutputDate), ct);
        return mapper.Map<CuttingOutputDto>(output);
    }

    public async Task<CuttingWastageDto> Handle(CreateCuttingWastageCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var wastage = new CuttingWastage { CompanyId = r.CompanyId, CuttingPlanId = r.CuttingPlanId, OrderId = r.OrderId, WastageDate = r.WastageDate, FabricItemId = r.FabricItemId, WastageQty = r.WastageQty, WastageReason = r.WastageReason, CreatedBy = r.CreatedBy };
        await uow.Wastages.AddAsync(wastage, ct);
        await uow.SaveChangesAsync(ct);
        await publisher.PublishAsync(new CuttingWastageCreated(wastage.CompanyId, wastage.OrderId, wastage.CuttingPlanId, wastage.WastageQty, wastage.WastageReason), ct);
        return mapper.Map<CuttingWastageDto>(wastage);
    }

    public async Task<CuttingPanelTransferDto> Handle(CreateCuttingPanelTransferCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var transfer = new CuttingPanelTransfer { CompanyId = r.CompanyId, OrderId = r.OrderId, CuttingPlanId = r.CuttingPlanId, TransferNo = r.TransferNo, TransferDate = r.TransferDate, ToDepartment = string.IsNullOrWhiteSpace(r.ToDepartment) ? "Production" : r.ToDepartment, CreatedBy = r.CreatedBy };
        transfer.Items = r.Items.Select(x => new CuttingPanelTransferItem { CompanyId = r.CompanyId, ColorName = x.ColorName, SizeName = x.SizeName, TransferQty = x.TransferQty }).ToList();
        transfer.TotalTransferQty = transfer.Items.Sum(x => x.TransferQty);
        await uow.PanelTransfers.AddAsync(transfer, ct);
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingPanelTransferDto>(transfer);
    }

    public async Task<CuttingPanelTransferDto> Handle(ConfirmCuttingPanelTransferCommand command, CancellationToken ct)
    {
        var transfer = await db.CuttingPanelTransfers.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == command.Id, ct) ?? throw new KeyNotFoundException("Panel transfer not found.");
        foreach (var item in transfer.Items)
        {
            var balance = await db.CuttingBalances.FirstOrDefaultAsync(x => x.CompanyId == transfer.CompanyId && x.OrderId == transfer.OrderId && x.ColorName == item.ColorName && x.SizeName == item.SizeName, ct);
            var transferable = (balance?.CutQty ?? 0) - (balance?.TransferredQty ?? 0);
            if (item.TransferQty > transferable) throw new InvalidOperationException("Panel transfer cannot exceed cut balance.");
        }
        transfer.Status = PanelTransferStatuses.Confirmed;
        transfer.ConfirmedAt = BusinessTime.Now;
        await balances.AddTransferAsync(transfer, ct);
        await uow.SaveChangesAsync(ct);
        await production.NotifyPanelTransferAsync(transfer.CompanyId, transfer.OrderId, transfer.Id, ct);
        await publisher.PublishAsync(new CuttingPanelTransferred(transfer.CompanyId, transfer.OrderId, transfer.Id, transfer.TransferNo, transfer.TotalTransferQty, transfer.TransferDate), ct);
        return mapper.Map<CuttingPanelTransferDto>(transfer);
    }

    public async Task<CuttingPanelTransferDto> Handle(CancelCuttingPanelTransferCommand command, CancellationToken ct)
    {
        var transfer = await uow.PanelTransfers.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Panel transfer not found.");
        if (transfer.Status == PanelTransferStatuses.Confirmed) throw new InvalidOperationException("Confirmed transfer cannot be cancelled.");
        transfer.Status = PanelTransferStatuses.Cancelled;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingPanelTransferDto>(transfer);
    }

    public async Task<CuttingBundleDto> Handle(CreateCuttingBundleCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var plan = await uow.CuttingPlans.GetByIdAsync(r.CuttingPlanId, ct) ?? throw new KeyNotFoundException("Cutting plan not found.");
        if (plan.CompanyId != r.CompanyId) throw new InvalidOperationException("Plan company mismatch.");
        if (await uow.Bundles.Query().AnyAsync(x => x.CompanyId == r.CompanyId && x.BundleTag == r.BundleTag.Trim(), ct))
            throw new InvalidOperationException("Bundle tag already exists.");
        var bundle = new CuttingBundle
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            CuttingPlanId = r.CuttingPlanId,
            CuttingLayId = r.CuttingLayId,
            CuttingOutputId = r.CuttingOutputId,
            BundleTag = r.BundleTag.Trim(),
            PlanNo = plan.PlanNo,
            StyleName = r.StyleName,
            SizeName = r.SizeName.Trim(),
            PieceCount = r.PieceCount,
            SerialFrom = r.SerialFrom,
            SerialTo = r.SerialTo,
            SerialRange = r.SerialRange ?? (r.SerialFrom.HasValue && r.SerialTo.HasValue ? $"{r.SerialFrom}-{r.SerialTo}" : null),
            WeightKg = r.WeightKg,
            CurrentLocation = r.CurrentLocation,
            Status = BundleStatuses.Ready,
            CreatedBy = r.CreatedBy,
        };
        await uow.Bundles.AddAsync(bundle, ct);
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingBundleDto>(bundle);
    }

    public async Task<CuttingBundleDto> Handle(UpdateCuttingBundleCommand command, CancellationToken ct)
    {
        var bundle = await uow.Bundles.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Bundle not found.");
        var r = command.Request;
        bundle.SizeName = r.SizeName.Trim();
        bundle.PieceCount = r.PieceCount;
        bundle.SerialFrom = r.SerialFrom;
        bundle.SerialTo = r.SerialTo;
        bundle.SerialRange = r.SerialRange ?? (r.SerialFrom.HasValue && r.SerialTo.HasValue ? $"{r.SerialFrom}-{r.SerialTo}" : bundle.SerialRange);
        bundle.WeightKg = r.WeightKg;
        bundle.CurrentLocation = r.CurrentLocation;
        bundle.UpdatedBy = r.UpdatedBy;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingBundleDto>(bundle);
    }

    public async Task<CuttingBundleDto> Handle(UpdateCuttingBundleStatusCommand command, CancellationToken ct)
    {
        var bundle = await uow.Bundles.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Bundle not found.");
        bundle.Status = command.Request.Status.Trim();
        if (!string.IsNullOrWhiteSpace(command.Request.CurrentLocation)) bundle.CurrentLocation = command.Request.CurrentLocation;
        bundle.UpdatedBy = command.Request.UpdatedBy;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<CuttingBundleDto>(bundle);
    }

    private static void EnsureNotCompleted(CuttingPlan plan)
    {
        if (plan.Status == CuttingPlanStatuses.Completed) throw new InvalidOperationException("Completed cutting plan cannot be edited.");
    }
}

internal static class CacheKeys
{
    public static string Plan(Guid id) => $"cutting:plan:{id}";
    public static string Balance(Guid companyId, Guid orderId) => $"cutting:balance:{companyId}:{orderId}";
}
