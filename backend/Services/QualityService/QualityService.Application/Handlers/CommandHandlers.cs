using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QualityService.Domain;
using QualityService.Contracts;
using System.Text.Json;

using Erp.BuildingBlocks.SharedKernel;

namespace QualityService.Application.Handlers;

public sealed class CommandHandlers(
    IUnitOfWork uow,
    IQualityDbContext db,
    IMapper mapper,
    IRedisCacheService cache,
    IIntegrationEventPublisher eventPublisher,
    IMerchandisingServiceClient merchandising,
    IShipmentServiceClient shipment) :
    IRequestHandler<CreateQualityCheckpointCommand, QualityCheckpointDto>,
    IRequestHandler<UpdateQualityCheckpointCommand, QualityCheckpointDto>,
    IRequestHandler<ActivateQualityCheckpointCommand, QualityCheckpointDto>,
    IRequestHandler<DeactivateQualityCheckpointCommand, QualityCheckpointDto>,
    IRequestHandler<CreateDefectCategoryCommand, DefectCategoryDto>,
    IRequestHandler<CreateDefectTypeCommand, DefectTypeDto>,
    IRequestHandler<UpdateDefectTypeCommand, DefectTypeDto>,
    IRequestHandler<CreateQualityInspectionCommand, QualityInspectionDto>,
    IRequestHandler<UpdateQualityInspectionCommand, QualityInspectionDto>,
    IRequestHandler<SubmitQualityInspectionCommand, QualityInspectionDto>,
    IRequestHandler<ApproveQualityInspectionCommand, QualityInspectionDto>,
    IRequestHandler<CancelQualityInspectionCommand, QualityInspectionDto>,
    IRequestHandler<AddInspectionDefectCommand, QualityInspectionDefectDto>,
    IRequestHandler<CreateQualityReworkCommand, QualityReworkDto>,
    IRequestHandler<SendQualityReworkCommand, QualityReworkDto>,
    IRequestHandler<CompleteQualityReworkCommand, QualityReworkDto>,
    IRequestHandler<CreateQualityRejectCommand, QualityRejectDto>,
    IRequestHandler<CreateAQLStandardCommand, AQLStandardDto>,
    IRequestHandler<CreateFinalInspectionCommand, FinalInspectionDto>,
    IRequestHandler<ApproveFinalInspectionCommand, FinalInspectionDto>,
    IRequestHandler<CancelFinalInspectionCommand, FinalInspectionDto>
{
    private async Task LogAuditAsync(Guid companyId, string referenceType, Guid referenceId, string actionName, object? oldValue, object? newValue, Guid? userId)
    {
        var log = new QualityAuditLog
        {
            CompanyId = companyId,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            ActionName = actionName,
            OldValue = oldValue is not null ? JsonSerializer.Serialize(oldValue) : null,
            NewValue = newValue is not null ? JsonSerializer.Serialize(newValue) : null,
            ActionBy = userId,
            ActionAt = BusinessTime.Now
        };
        db.QualityAuditLogs.Add(log);
        await Task.CompletedTask;
    }

    public async Task<QualityCheckpointDto> Handle(CreateQualityCheckpointCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var existing = await db.QualityCheckpoints.AnyAsync(x => x.CompanyId == req.CompanyId && x.CheckpointCode == req.CheckpointCode, ct);
        if (existing) throw new InvalidOperationException($"Checkpoint code '{req.CheckpointCode}' already exists in company.");

        var checkpoint = new QualityCheckpoint
        {
            CompanyId = req.CompanyId,
            CheckpointCode = req.CheckpointCode,
            CheckpointName = req.CheckpointName,
            CheckpointType = req.CheckpointType,
            IsActive = true,
            CreatedBy = req.CreatedBy
        };

        db.QualityCheckpoints.Add(checkpoint);
        await uow.SaveChangesAsync(ct);

        await LogAuditAsync(req.CompanyId, nameof(QualityCheckpoint), checkpoint.Id, "Create", null, checkpoint, req.CreatedBy);
        return mapper.Map<QualityCheckpointDto>(checkpoint);
    }

    public async Task<QualityCheckpointDto> Handle(UpdateQualityCheckpointCommand cmd, CancellationToken ct)
    {
        var checkpoint = await db.QualityCheckpoints.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Checkpoint not found.");
        var old = new QualityCheckpoint 
        { 
            CheckpointName = checkpoint.CheckpointName, 
            CheckpointType = checkpoint.CheckpointType 
        };

        checkpoint.CheckpointName = cmd.Request.CheckpointName;
        checkpoint.CheckpointType = cmd.Request.CheckpointType;
        checkpoint.UpdatedBy = cmd.Request.UpdatedBy;
        checkpoint.UpdatedAt = BusinessTime.Now;

        db.QualityCheckpoints.Update(checkpoint);
        await uow.SaveChangesAsync(ct);

        await cache.RemoveAsync(CacheKeys.Checkpoint(checkpoint.CompanyId, checkpoint.Id), ct);
        await LogAuditAsync(checkpoint.CompanyId, nameof(QualityCheckpoint), checkpoint.Id, "Update", old, checkpoint, cmd.Request.UpdatedBy);

        return mapper.Map<QualityCheckpointDto>(checkpoint);
    }

    public async Task<QualityCheckpointDto> Handle(ActivateQualityCheckpointCommand cmd, CancellationToken ct)
    {
        var checkpoint = await db.QualityCheckpoints.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Checkpoint not found.");
        checkpoint.IsActive = true;
        checkpoint.UpdatedAt = BusinessTime.Now;

        db.QualityCheckpoints.Update(checkpoint);
        await uow.SaveChangesAsync(ct);

        await cache.RemoveAsync(CacheKeys.Checkpoint(checkpoint.CompanyId, checkpoint.Id), ct);
        return mapper.Map<QualityCheckpointDto>(checkpoint);
    }

    public async Task<QualityCheckpointDto> Handle(DeactivateQualityCheckpointCommand cmd, CancellationToken ct)
    {
        var checkpoint = await db.QualityCheckpoints.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Checkpoint not found.");
        checkpoint.IsActive = false;
        checkpoint.UpdatedAt = BusinessTime.Now;

        db.QualityCheckpoints.Update(checkpoint);
        await uow.SaveChangesAsync(ct);

        await cache.RemoveAsync(CacheKeys.Checkpoint(checkpoint.CompanyId, checkpoint.Id), ct);
        return mapper.Map<QualityCheckpointDto>(checkpoint);
    }

    public async Task<DefectCategoryDto> Handle(CreateDefectCategoryCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var existing = await db.DefectCategories.AnyAsync(x => x.CompanyId == req.CompanyId && x.CategoryCode == req.CategoryCode, ct);
        if (existing) throw new InvalidOperationException($"Category code '{req.CategoryCode}' already exists.");

        var category = new DefectCategory
        {
            CompanyId = req.CompanyId,
            CategoryCode = req.CategoryCode,
            CategoryName = req.CategoryName,
            IsActive = true,
            CreatedBy = req.CreatedBy
        };

        db.DefectCategories.Add(category);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<DefectCategoryDto>(category);
    }

    public async Task<DefectTypeDto> Handle(CreateDefectTypeCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var existing = await db.DefectTypes.AnyAsync(x => x.CompanyId == req.CompanyId && x.DefectCode == req.DefectCode, ct);
        if (existing) throw new InvalidOperationException($"Defect type '{req.DefectCode}' already exists.");

        var defectType = new DefectType
        {
            CompanyId = req.CompanyId,
            DefectCategoryId = req.DefectCategoryId,
            DefectCode = req.DefectCode,
            DefectName = req.DefectName,
            Severity = req.Severity,
            IsActive = true,
            CreatedBy = req.CreatedBy
        };

        db.DefectTypes.Add(defectType);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<DefectTypeDto>(defectType);
    }

    public async Task<DefectTypeDto> Handle(UpdateDefectTypeCommand cmd, CancellationToken ct)
    {
        var defectType = await db.DefectTypes.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Defect type not found.");
        defectType.DefectName = cmd.Request.DefectName;
        defectType.Severity = cmd.Request.Severity;
        defectType.UpdatedBy = cmd.Request.UpdatedBy;
        defectType.UpdatedAt = BusinessTime.Now;

        db.DefectTypes.Update(defectType);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<DefectTypeDto>(defectType);
    }

    public async Task<QualityInspectionDto> Handle(CreateQualityInspectionCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var orderOk = await merchandising.OrderExistsAsync(req.CompanyId, req.OrderId, ct);
        if (!orderOk) throw new InvalidOperationException("External order does not exist or matches different company.");

        var existing = await db.QualityInspections.AnyAsync(x => x.CompanyId == req.CompanyId && x.InspectionNo == req.InspectionNo, ct);
        if (existing) throw new InvalidOperationException($"Inspection number '{req.InspectionNo}' already exists.");

        var checkpoint = await db.QualityCheckpoints.FindAsync([req.CheckpointId], ct) ?? throw new KeyNotFoundException("Checkpoint not found.");
        if (!checkpoint.IsActive) throw new InvalidOperationException("Quality checkpoint is inactive.");

        var inspection = new QualityInspection
        {
            CompanyId = req.CompanyId,
            OrderId = req.OrderId,
            StyleId = req.StyleId,
            BuyerPurchaseOrderId = req.BuyerPurchaseOrderId,
            CheckpointId = req.CheckpointId,
            InspectionNo = req.InspectionNo,
            InspectionDate = req.InspectionDate,
            InspectionType = req.InspectionType,
            ColorName = req.ColorName,
            SizeName = req.SizeName,
            InspectedQty = req.InspectedQty,
            PassedQty = req.PassedQty,
            DefectQty = req.DefectQty,
            ReworkQty = req.ReworkQty,
            RejectQty = req.RejectQty,
            Result = QualityInspectionResults.Pending,
            Status = QualityInspectionStatuses.Draft,
            Remarks = req.Remarks,
            CreatedBy = req.CreatedBy
        };

        db.QualityInspections.Add(inspection);
        await uow.SaveChangesAsync(ct);

        foreach (var def in req.Defects)
        {
            var defect = new QualityInspectionDefect
            {
                CompanyId = req.CompanyId,
                QualityInspectionId = inspection.Id,
                DefectTypeId = def.DefectTypeId,
                DefectQty = def.DefectQty,
                DefectLocation = def.DefectLocation,
                ResponsibleDepartment = def.ResponsibleDepartment,
                Remarks = def.Remarks
            };
            db.QualityInspectionDefects.Add(defect);
        }
        await uow.SaveChangesAsync(ct);

        return mapper.Map<QualityInspectionDto>(inspection);
    }

    public async Task<QualityInspectionDto> Handle(UpdateQualityInspectionCommand cmd, CancellationToken ct)
    {
        var inspection = await db.QualityInspections
            .Include(x => x.Defects)
            .FirstOrDefaultAsync(x => x.Id == cmd.Id, ct) ?? throw new KeyNotFoundException("Inspection not found.");

        if (inspection.Status == QualityInspectionStatuses.Approved)
            throw new InvalidOperationException("Approved inspection cannot be edited.");

        var req = cmd.Request;
        if (req.PassedQty + req.DefectQty + req.RejectQty > req.InspectedQty)
            throw new InvalidOperationException("Sum of passed, defect, and reject quantities exceeds inspected quantity.");

        inspection.InspectionDate = req.InspectionDate;
        inspection.InspectedQty = req.InspectedQty;
        inspection.PassedQty = req.PassedQty;
        inspection.DefectQty = req.DefectQty;
        inspection.ReworkQty = req.ReworkQty;
        inspection.RejectQty = req.RejectQty;
        inspection.Remarks = req.Remarks;
        inspection.UpdatedBy = req.UpdatedBy;
        inspection.UpdatedAt = BusinessTime.Now;

        db.QualityInspectionDefects.RemoveRange(inspection.Defects);

        foreach (var def in req.Defects)
        {
            var defect = new QualityInspectionDefect
            {
                CompanyId = inspection.CompanyId,
                QualityInspectionId = inspection.Id,
                DefectTypeId = def.DefectTypeId,
                DefectQty = def.DefectQty,
                DefectLocation = def.DefectLocation,
                ResponsibleDepartment = def.ResponsibleDepartment,
                Remarks = def.Remarks
            };
            db.QualityInspectionDefects.Add(defect);
        }

        db.QualityInspections.Update(inspection);
        await uow.SaveChangesAsync(ct);

        await cache.RemoveAsync(CacheKeys.Inspection(inspection.CompanyId, inspection.Id), ct);
        return mapper.Map<QualityInspectionDto>(inspection);
    }

    public async Task<QualityInspectionDto> Handle(SubmitQualityInspectionCommand cmd, CancellationToken ct)
    {
        var inspection = await db.QualityInspections.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Inspection not found.");
        if (inspection.Status != QualityInspectionStatuses.Draft)
            throw new InvalidOperationException("Only draft inspections can be submitted.");

        inspection.Status = QualityInspectionStatuses.Submitted;
        inspection.UpdatedBy = cmd.UserId;
        inspection.UpdatedAt = BusinessTime.Now;

        db.QualityInspections.Update(inspection);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<QualityInspectionDto>(inspection);
    }

    public async Task<QualityInspectionDto> Handle(ApproveQualityInspectionCommand cmd, CancellationToken ct)
    {
        var inspection = await db.QualityInspections.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Inspection not found.");
        if (inspection.Status == QualityInspectionStatuses.Cancelled)
            throw new InvalidOperationException("Cancelled inspection cannot be approved.");

        inspection.Status = QualityInspectionStatuses.Approved;
        inspection.ApprovedBy = cmd.UserId;
        inspection.ApprovedAt = BusinessTime.Now;

        // Auto determine result
        inspection.Result = inspection.RejectQty > 0 || inspection.DefectQty > (inspection.InspectedQty * 0.15) 
            ? QualityInspectionResults.Failed 
            : QualityInspectionResults.Passed;

        db.QualityInspections.Update(inspection);
        await uow.SaveChangesAsync(ct);

        // Publish integration events
        if (inspection.Result == QualityInspectionResults.Passed)
        {
            await eventPublisher.PublishAsync(new QualityInspectionApproved(
                inspection.CompanyId,
                inspection.OrderId,
                inspection.CheckpointId,
                inspection.Id,
                inspection.InspectionNo,
                inspection.PassedQty,
                inspection.RejectQty
            ), ct);
        }
        else
        {
            await eventPublisher.PublishAsync(new QualityInspectionFailed(
                inspection.CompanyId,
                inspection.OrderId,
                inspection.CheckpointId,
                inspection.Id,
                inspection.InspectionNo,
                inspection.DefectQty,
                inspection.RejectQty
            ), ct);
        }

        return mapper.Map<QualityInspectionDto>(inspection);
    }

    public async Task<QualityInspectionDto> Handle(CancelQualityInspectionCommand cmd, CancellationToken ct)
    {
        var inspection = await db.QualityInspections.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Inspection not found.");
        if (inspection.Status == QualityInspectionStatuses.Approved)
            throw new InvalidOperationException("Approved inspection cannot be cancelled.");

        inspection.Status = QualityInspectionStatuses.Cancelled;
        inspection.UpdatedBy = cmd.UserId;
        inspection.UpdatedAt = BusinessTime.Now;

        db.QualityInspections.Update(inspection);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<QualityInspectionDto>(inspection);
    }

    public async Task<QualityInspectionDefectDto> Handle(AddInspectionDefectCommand cmd, CancellationToken ct)
    {
        var inspection = await db.QualityInspections.FindAsync([cmd.InspectionId], ct) ?? throw new KeyNotFoundException("Inspection not found.");
        if (inspection.Status == QualityInspectionStatuses.Approved)
            throw new InvalidOperationException("Cannot add defects to an approved inspection.");

        var req = cmd.Request;
        var defect = new QualityInspectionDefect
        {
            CompanyId = inspection.CompanyId,
            QualityInspectionId = inspection.Id,
            DefectTypeId = req.DefectTypeId,
            DefectQty = req.DefectQty,
            DefectLocation = req.DefectLocation,
            ResponsibleDepartment = req.ResponsibleDepartment,
            Remarks = req.Remarks
        };

        db.QualityInspectionDefects.Add(defect);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<QualityInspectionDefectDto>(defect);
    }

    public async Task<QualityReworkDto> Handle(CreateQualityReworkCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var rework = new QualityRework
        {
            CompanyId = req.CompanyId,
            QualityInspectionId = req.QualityInspectionId,
            OrderId = req.OrderId,
            ReworkNo = req.ReworkNo,
            ReworkDate = req.ReworkDate,
            ReworkQty = req.ReworkQty,
            ReworkReason = req.ReworkReason,
            SentToDepartment = req.SentToDepartment,
            Status = QualityReworkStatuses.Pending,
            CreatedBy = req.CreatedBy
        };

        db.QualityReworks.Add(rework);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<QualityReworkDto>(rework);
    }

    public async Task<QualityReworkDto> Handle(SendQualityReworkCommand cmd, CancellationToken ct)
    {
        var rework = await db.QualityReworks.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Rework sheet not found.");
        rework.Status = QualityReworkStatuses.Sent;
        rework.UpdatedBy = cmd.UserId;
        rework.UpdatedAt = BusinessTime.Now;

        db.QualityReworks.Update(rework);
        await uow.SaveChangesAsync(ct);

        await eventPublisher.PublishAsync(new QualityReworkCreated(
            rework.CompanyId,
            rework.OrderId,
            rework.QualityInspectionId,
            rework.Id,
            rework.ReworkNo,
            rework.ReworkQty,
            rework.SentToDepartment
        ), ct);

        return mapper.Map<QualityReworkDto>(rework);
    }

    public async Task<QualityReworkDto> Handle(CompleteQualityReworkCommand cmd, CancellationToken ct)
    {
        var rework = await db.QualityReworks.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Rework sheet not found.");
        rework.Status = QualityReworkStatuses.Completed;
        rework.CompletedAt = BusinessTime.Now;
        rework.UpdatedBy = cmd.UserId;
        rework.UpdatedAt = BusinessTime.Now;

        db.QualityReworks.Update(rework);
        await uow.SaveChangesAsync(ct);

        await eventPublisher.PublishAsync(new QualityReworkCompleted(
            rework.CompanyId,
            rework.OrderId,
            rework.Id,
            rework.ReworkNo,
            rework.ReworkQty
        ), ct);

        return mapper.Map<QualityReworkDto>(rework);
    }

    public async Task<QualityRejectDto> Handle(CreateQualityRejectCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var reject = new QualityReject
        {
            CompanyId = req.CompanyId,
            QualityInspectionId = req.QualityInspectionId,
            OrderId = req.OrderId,
            RejectNo = req.RejectNo,
            RejectDate = req.RejectDate,
            RejectQty = req.RejectQty,
            RejectReason = req.RejectReason,
            Status = QualityRejectStatuses.Created,
            CreatedBy = req.CreatedBy
        };

        db.QualityRejects.Add(reject);
        await uow.SaveChangesAsync(ct);

        await eventPublisher.PublishAsync(new QualityRejectCreated(
            reject.CompanyId,
            reject.OrderId,
            reject.QualityInspectionId,
            reject.Id,
            reject.RejectNo,
            reject.RejectQty
        ), ct);

        return mapper.Map<QualityRejectDto>(reject);
    }

    public async Task<AQLStandardDto> Handle(CreateAQLStandardCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var standard = new AQLStandard
        {
            CompanyId = req.CompanyId,
            AQLCode = req.AQLCode,
            AQLLevel = req.AQLLevel,
            LotSizeFrom = req.LotSizeFrom,
            LotSizeTo = req.LotSizeTo,
            SampleSize = req.SampleSize,
            AcceptQty = req.AcceptQty,
            RejectQty = req.RejectQty,
            IsActive = true,
            CreatedBy = req.CreatedBy
        };

        db.AQLStandards.Add(standard);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<AQLStandardDto>(standard);
    }

    public async Task<FinalInspectionDto> Handle(CreateFinalInspectionCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var orderOk = await merchandising.OrderExistsAsync(req.CompanyId, req.OrderId, ct);
        if (!orderOk) throw new InvalidOperationException("External order does not exist.");

        var standard = await db.AQLStandards.FirstOrDefaultAsync(x => 
            x.CompanyId == req.CompanyId && 
            req.LotSize >= x.LotSizeFrom && 
            req.LotSize <= x.LotSizeTo && 
            x.IsActive, ct);

        int sample = req.SampleSize;
        int accept = 0;
        int rejectLimit = 1;

        if (standard is not null)
        {
            sample = standard.SampleSize;
            accept = standard.AcceptQty;
            rejectLimit = standard.RejectQty;
        }

        var result = QualityInspectionResults.Passed;
        int totalDefects = req.CriticalDefects + req.MajorDefects + req.MinorDefects;

        if (totalDefects > accept)
        {
            result = QualityInspectionResults.Failed;
        }

        var inspection = new FinalInspection
        {
            CompanyId = req.CompanyId,
            OrderId = req.OrderId,
            BuyerPurchaseOrderId = req.BuyerPurchaseOrderId,
            InspectionNo = req.InspectionNo,
            InspectionDate = req.InspectionDate,
            LotSize = req.LotSize,
            SampleSize = sample,
            AQLStandardId = standard?.Id,
            CriticalDefects = req.CriticalDefects,
            MajorDefects = req.MajorDefects,
            MinorDefects = req.MinorDefects,
            Result = result,
            Status = QualityInspectionStatuses.Draft,
            Remarks = req.Remarks,
            CreatedBy = req.CreatedBy
        };

        db.FinalInspections.Add(inspection);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<FinalInspectionDto>(inspection);
    }

    public async Task<FinalInspectionDto> Handle(ApproveFinalInspectionCommand cmd, CancellationToken ct)
    {
        var inspection = await db.FinalInspections.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Final Inspection sheet not found.");
        if (inspection.Status == QualityInspectionStatuses.Cancelled)
            throw new InvalidOperationException("Cancelled inspection cannot be approved.");

        inspection.Status = QualityInspectionStatuses.Approved;
        inspection.ApprovedBy = cmd.UserId;
        inspection.ApprovedAt = BusinessTime.Now;

        db.FinalInspections.Update(inspection);
        await uow.SaveChangesAsync(ct);

        if (inspection.Result == QualityInspectionResults.Passed)
        {
            await eventPublisher.PublishAsync(new FinalInspectionApproved(
                inspection.CompanyId,
                inspection.OrderId,
                inspection.BuyerPurchaseOrderId,
                inspection.Id,
                inspection.Result,
                inspection.InspectionDate
            ), ct);

            // Notify Shipment Service Client
            await shipment.NotifyFinalInspectionPassedAsync(inspection.CompanyId, inspection.OrderId, ct);
        }
        else
        {
            await eventPublisher.PublishAsync(new FinalInspectionFailed(
                inspection.CompanyId,
                inspection.OrderId,
                inspection.BuyerPurchaseOrderId,
                inspection.Id,
                inspection.Result,
                inspection.InspectionDate
            ), ct);
        }

        return mapper.Map<FinalInspectionDto>(inspection);
    }

    public async Task<FinalInspectionDto> Handle(CancelFinalInspectionCommand cmd, CancellationToken ct)
    {
        var inspection = await db.FinalInspections.FindAsync([cmd.Id], ct) ?? throw new KeyNotFoundException("Final Inspection not found.");
        if (inspection.Status == QualityInspectionStatuses.Approved)
            throw new InvalidOperationException("Approved inspection cannot be cancelled.");

        inspection.Status = QualityInspectionStatuses.Cancelled;
        inspection.UpdatedBy = cmd.UserId;
        inspection.UpdatedAt = BusinessTime.Now;

        db.FinalInspections.Update(inspection);
        await uow.SaveChangesAsync(ct);

        return mapper.Map<FinalInspectionDto>(inspection);
    }
}
