using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SecurityService.Contracts;
using SecurityService.Domain;

using Erp.BuildingBlocks.SharedKernel;

namespace SecurityService.Application.Services;

public sealed class SecurityOperationsService(
    ISecurityDbContext db,
    IMapper mapper,
    ICurrentUserService currentUser,
    IIntegrationEventPublisher publisher,
    IAccountsServiceClient accountsClient)
    : IVisitorEntryService,
      IEmployeeOutPassService,
      IVehicleEntryService,
      IGatePassService,
      IChalanService,
      IBillEntryService,
      ISecurityCheckService
{
    Task<VisitorEntryDto> IVisitorEntryService.CancelAsync(Guid id, CancellationToken cancellationToken) => CancelVisitorEntryAsync(id, cancellationToken);
    Task<EmployeeOutPassDto> IEmployeeOutPassService.ApproveAsync(Guid id, CancellationToken cancellationToken) => ApproveEmployeeOutPassAsync(id, cancellationToken);
    Task<EmployeeOutPassDto> IEmployeeOutPassService.CancelAsync(Guid id, CancellationToken cancellationToken) => CancelEmployeeOutPassAsync(id, cancellationToken);
    Task<GatePassDto> IGatePassService.SubmitAsync(Guid id, CancellationToken cancellationToken) => SubmitGatePassAsync(id, cancellationToken);
    Task<GatePassDto> IGatePassService.ApproveAsync(Guid id, CancellationToken cancellationToken) => ApproveGatePassAsync(id, cancellationToken);
    Task<GatePassDto> IGatePassService.IssueAsync(Guid id, CancellationToken cancellationToken) => IssueGatePassAsync(id, cancellationToken);
    Task<GatePassDto> IGatePassService.CompleteAsync(Guid id, CancellationToken cancellationToken) => CompleteGatePassAsync(id, cancellationToken);
    Task<GatePassDto> IGatePassService.CancelAsync(Guid id, CancellationToken cancellationToken) => CancelGatePassAsync(id, cancellationToken);
    Task<ChalanDto> IChalanService.ApproveAsync(Guid id, CancellationToken cancellationToken) => ApproveChalanAsync(id, cancellationToken);
    Task<ChalanDto> IChalanService.CancelAsync(Guid id, CancellationToken cancellationToken) => CancelChalanAsync(id, cancellationToken);
    Task<BillEntryDto> IBillEntryService.ApproveAsync(Guid id, CancellationToken cancellationToken) => ApproveBillEntryAsync(id, cancellationToken);

    public async Task<VisitorEntryDto> CreateAsync(CreateVisitorEntryRequest request, CancellationToken cancellationToken = default)
    {
        var visitor = await db.Visitors.FirstOrDefaultAsync(x => x.Id == request.VisitorId && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw NotFound("Visitor", request.VisitorId);
        if (visitor.IsBlacklisted)
        {
            throw new InvalidOperationException("Visitor cannot enter because the visitor is blacklisted.");
        }

        await EnsureGateAsync(request.CompanyId, request.GateId, cancellationToken);
        await EnsureUniqueAsync(db.VisitorEntries.AnyAsync(x => x.CompanyId == request.CompanyId && x.EntryNo == request.EntryNo, cancellationToken), "EntryNo already exists for this company.");

        var entity = new VisitorEntry
        {
            CompanyId = request.CompanyId,
            GateId = request.GateId,
            VisitorId = request.VisitorId,
            EntryNo = request.EntryNo,
            VisitDate = request.VisitDate,
            InTime = request.InTime,
            Purpose = request.Purpose,
            PersonToMeetEmployeeId = request.PersonToMeetEmployeeId,
            DepartmentId = request.DepartmentId,
            VisitorCardNo = request.VisitorCardNo,
            Status = VisitorEntryStatuses.CheckedIn,
            CreatedBy = currentUser.UserId,
        };
        db.Add(entity);
        AddAction(entity.CompanyId, entity.GateId, SecurityReferenceTypes.VisitorEntry, entity.Id, "VisitorCheckedIn", entity.Purpose);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(SecurityEventNames.VisitorCheckedIn, entity.CompanyId, entity.Id, entity, cancellationToken);
        return mapper.Map<VisitorEntryDto>(entity);
    }

    public async Task<VisitorEntryDto> CheckoutAsync(Guid id, DateTime outTime, CancellationToken cancellationToken = default)
    {
        var entity = await db.VisitorEntries.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("VisitorEntry", id);
        if (entity.Status != VisitorEntryStatuses.CheckedIn)
        {
            throw new InvalidOperationException("Only checked-in visitors can be checked out.");
        }

        if (outTime < entity.InTime)
        {
            throw new InvalidOperationException("Visitor checkout time cannot be earlier than check-in time.");
        }

        entity.OutTime = outTime;
        entity.Status = VisitorEntryStatuses.CheckedOut;
        AddAction(entity.CompanyId, entity.GateId, SecurityReferenceTypes.VisitorEntry, entity.Id, "VisitorCheckedOut", null);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(SecurityEventNames.VisitorCheckedOut, entity.CompanyId, entity.Id, entity, cancellationToken);
        return mapper.Map<VisitorEntryDto>(entity);
    }

    private async Task<VisitorEntryDto> CancelVisitorEntryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.VisitorEntries.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("VisitorEntry", id);
        entity.Status = VisitorEntryStatuses.Cancelled;
        AddAction(entity.CompanyId, entity.GateId, SecurityReferenceTypes.VisitorEntry, entity.Id, "VisitorEntryCancelled", null);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<VisitorEntryDto>(entity);
    }

    public async Task<EmployeeOutPassDto> CreateAsync(CreateEmployeeOutPassRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureGateAsync(request.CompanyId, request.GateId, cancellationToken);
        await EnsureUniqueAsync(db.EmployeeOutPasses.AnyAsync(x => x.CompanyId == request.CompanyId && x.PassNo == request.PassNo, cancellationToken), "PassNo already exists for this company.");
        var entity = new EmployeeOutPass
        {
            CompanyId = request.CompanyId,
            GateId = request.GateId,
            EmployeeId = request.EmployeeId,
            PassNo = request.PassNo,
            PassDate = request.PassDate,
            OutTime = request.OutTime,
            ExpectedReturnTime = request.ExpectedReturnTime,
            Reason = request.Reason,
            ApprovalStatus = ApprovalStatuses.Pending,
            Status = EmployeeOutPassStatuses.Pending,
            CreatedBy = currentUser.UserId,
        };
        db.Add(entity);
        AddAction(entity.CompanyId, entity.GateId, "EmployeeOutPass", entity.Id, "EmployeeOutPassCreated", entity.Reason);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<EmployeeOutPassDto>(entity);
    }

    private async Task<EmployeeOutPassDto> ApproveEmployeeOutPassAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.EmployeeOutPasses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("EmployeeOutPass", id);
        if (entity.Status != EmployeeOutPassStatuses.Pending)
        {
            throw new InvalidOperationException("Only pending employee out passes can be approved.");
        }

        entity.ApprovalStatus = ApprovalStatuses.Approved;
        entity.Status = EmployeeOutPassStatuses.Approved;
        entity.ApprovedBy = currentUser.UserId;
        entity.ApprovedAt = BusinessTime.Now;
        AddAction(entity.CompanyId, entity.GateId, "EmployeeOutPass", entity.Id, "EmployeeOutPassApproved", null);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(SecurityEventNames.EmployeeOutPassApproved, entity.CompanyId, entity.Id, entity, cancellationToken);
        return mapper.Map<EmployeeOutPassDto>(entity);
    }

    public async Task<EmployeeOutPassDto> MarkOutAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.EmployeeOutPasses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("EmployeeOutPass", id);
        if (entity.ApprovalStatus != ApprovalStatuses.Approved)
        {
            throw new InvalidOperationException("Employee out pass must be approved before out.");
        }

        entity.Status = EmployeeOutPassStatuses.Out;
        AddAction(entity.CompanyId, entity.GateId, "EmployeeOutPass", entity.Id, "EmployeeMarkedOut", null);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<EmployeeOutPassDto>(entity);
    }

    public async Task<EmployeeOutPassDto> MarkReturnedAsync(Guid id, DateTime actualReturnTime, CancellationToken cancellationToken = default)
    {
        var entity = await db.EmployeeOutPasses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("EmployeeOutPass", id);
        if (actualReturnTime < entity.OutTime)
        {
            throw new InvalidOperationException("Actual return time cannot be earlier than out time.");
        }

        entity.ActualReturnTime = actualReturnTime;
        entity.Status = EmployeeOutPassStatuses.Returned;
        AddAction(entity.CompanyId, entity.GateId, "EmployeeOutPass", entity.Id, "EmployeeReturned", null);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<EmployeeOutPassDto>(entity);
    }

    private async Task<EmployeeOutPassDto> CancelEmployeeOutPassAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.EmployeeOutPasses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("EmployeeOutPass", id);
        entity.Status = EmployeeOutPassStatuses.Cancelled;
        AddAction(entity.CompanyId, entity.GateId, "EmployeeOutPass", entity.Id, "EmployeeOutPassCancelled", null);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<EmployeeOutPassDto>(entity);
    }

    public async Task<VehicleEntryDto> CreateAsync(CreateVehicleEntryRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureGateAsync(request.CompanyId, request.GateId, cancellationToken);
        var vehicle = await db.Vehicles.FirstOrDefaultAsync(x => x.Id == request.VehicleId && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw NotFound("Vehicle", request.VehicleId);
        if (string.IsNullOrWhiteSpace(vehicle.VehicleNo))
        {
            throw new InvalidOperationException("Vehicle entry must have vehicle number.");
        }

        await EnsureUniqueAsync(db.VehicleEntries.AnyAsync(x => x.CompanyId == request.CompanyId && x.EntryNo == request.EntryNo, cancellationToken), "Vehicle EntryNo already exists for this company.");
        var entity = new VehicleEntry
        {
            CompanyId = request.CompanyId,
            GateId = request.GateId,
            VehicleId = request.VehicleId,
            EntryNo = request.EntryNo,
            EntryDate = request.EntryDate,
            InTime = request.InTime,
            Purpose = request.Purpose,
            DriverName = request.DriverName ?? vehicle.DriverName,
            DriverPhone = request.DriverPhone ?? vehicle.DriverPhone,
            Status = VehicleEntryStatuses.In,
            CreatedBy = currentUser.UserId,
        };
        db.Add(entity);
        AddAction(entity.CompanyId, entity.GateId, SecurityReferenceTypes.VehicleEntry, entity.Id, "VehicleEntered", vehicle.VehicleNo);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(SecurityEventNames.VehicleEntered, entity.CompanyId, entity.Id, entity, cancellationToken);
        return mapper.Map<VehicleEntryDto>(entity);
    }

    public async Task<VehicleEntryDto> ExitAsync(Guid id, DateTime outTime, CancellationToken cancellationToken = default)
    {
        var entity = await db.VehicleEntries.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("VehicleEntry", id);
        if (outTime < entity.InTime)
        {
            throw new InvalidOperationException("Vehicle cannot exit before entry.");
        }

        entity.OutTime = outTime;
        entity.Status = VehicleEntryStatuses.Out;
        AddAction(entity.CompanyId, entity.GateId, SecurityReferenceTypes.VehicleEntry, entity.Id, "VehicleExited", null);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(SecurityEventNames.VehicleExited, entity.CompanyId, entity.Id, entity, cancellationToken);
        return mapper.Map<VehicleEntryDto>(entity);
    }

    public async Task<GatePassDto> CreateAsync(CreateGatePassRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureGateAsync(request.CompanyId, request.GateId, cancellationToken);
        await EnsureUniqueAsync(db.GatePasses.AnyAsync(x => x.CompanyId == request.CompanyId && x.GatePassNo == request.GatePassNo, cancellationToken), "GatePassNo already exists for this company.");
        var requiresApproval = request.Direction == GatePassDirections.Out || request.GatePassType is GatePassTypes.MaterialOut or GatePassTypes.Returnable or GatePassTypes.NonReturnable;
        var entity = new GatePass
        {
            CompanyId = request.CompanyId,
            GateId = request.GateId,
            GatePassNo = request.GatePassNo,
            GatePassDate = request.GatePassDate,
            GatePassType = request.GatePassType,
            Direction = request.Direction,
            ReferenceType = request.ReferenceType,
            ReferenceId = request.ReferenceId,
            DepartmentId = request.DepartmentId,
            SupplierId = request.SupplierId,
            BuyerId = request.BuyerId,
            VehicleNo = request.VehicleNo,
            DriverName = request.DriverName,
            Purpose = request.Purpose,
            IsReturnable = request.IsReturnable || request.GatePassType == GatePassTypes.Returnable,
            ExpectedReturnDate = request.ExpectedReturnDate,
            ApprovalStatus = requiresApproval ? ApprovalStatuses.Pending : ApprovalStatuses.Approved,
            Status = GatePassStatuses.Draft,
            CreatedBy = currentUser.UserId,
            Items = request.Items.Select(item => new GatePassItem
            {
                CompanyId = request.CompanyId,
                ItemName = item.ItemName,
                ItemDescription = item.ItemDescription,
                UnitName = item.UnitName,
                Quantity = item.Quantity,
                Remarks = item.Remarks,
                CreatedBy = currentUser.UserId,
            }).ToList(),
        };

        if (entity.IsReturnable && entity.ExpectedReturnDate is null)
        {
            throw new InvalidOperationException("Returnable gate pass must have ExpectedReturnDate.");
        }

        db.Add(entity);
        AddAction(entity.CompanyId, entity.GateId, SecurityReferenceTypes.GatePass, entity.Id, "GatePassCreated", entity.Purpose);
        await db.SaveChangesAsync(cancellationToken);
        return await GetGatePassDtoAsync(entity.Id, cancellationToken);
    }

    private Task<GatePassDto> SubmitGatePassAsync(Guid id, CancellationToken cancellationToken = default) =>
        UpdateGatePassStatusAsync(id, GatePassStatuses.Draft, GatePassStatuses.Submitted, "GatePassSubmitted", null, cancellationToken);

    private async Task<GatePassDto> ApproveGatePassAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.GatePasses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("GatePass", id);
        if (entity.Status is GatePassStatuses.Completed or GatePassStatuses.Cancelled)
        {
            throw new InvalidOperationException("Completed or cancelled gate pass cannot be approved.");
        }

        entity.ApprovalStatus = ApprovalStatuses.Approved;
        entity.ApprovedBy = currentUser.UserId;
        entity.ApprovedAt = BusinessTime.Now;
        entity.Status = GatePassStatuses.Approved;
        AddAction(entity.CompanyId, entity.GateId, SecurityReferenceTypes.GatePass, entity.Id, "GatePassApproved", null);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(SecurityEventNames.GatePassApproved, entity.CompanyId, entity.Id, entity, cancellationToken);
        return await GetGatePassDtoAsync(entity.Id, cancellationToken);
    }

    private async Task<GatePassDto> IssueGatePassAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.GatePasses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("GatePass", id);
        if (entity.ApprovalStatus != ApprovalStatuses.Approved)
        {
            throw new InvalidOperationException("Gate pass must be approved before issue.");
        }

        entity.Status = GatePassStatuses.Issued;
        AddAction(entity.CompanyId, entity.GateId, SecurityReferenceTypes.GatePass, entity.Id, "GatePassIssued", null);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(SecurityEventNames.GatePassIssued, entity.CompanyId, entity.Id, entity, cancellationToken);
        return await GetGatePassDtoAsync(entity.Id, cancellationToken);
    }

    private Task<GatePassDto> CompleteGatePassAsync(Guid id, CancellationToken cancellationToken = default) =>
        UpdateGatePassStatusAsync(id, null, GatePassStatuses.Completed, "GatePassCompleted", SecurityEventNames.GatePassCompleted, cancellationToken);

    private Task<GatePassDto> CancelGatePassAsync(Guid id, CancellationToken cancellationToken = default) =>
        UpdateGatePassStatusAsync(id, null, GatePassStatuses.Cancelled, "GatePassCancelled", null, cancellationToken);

    public async Task<ChalanDto> CreateAsync(CreateChalanRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureUniqueAsync(db.Chalans.AnyAsync(x => x.CompanyId == request.CompanyId && x.ChalanNo == request.ChalanNo, cancellationToken), "ChalanNo already exists for this company.");
        var entity = new Chalan
        {
            CompanyId = request.CompanyId,
            ChalanNo = request.ChalanNo,
            ChalanDate = request.ChalanDate,
            ChalanType = request.ChalanType,
            SupplierId = request.SupplierId,
            BuyerId = request.BuyerId,
            OrderId = request.OrderId,
            VehicleNo = request.VehicleNo,
            DriverName = request.DriverName,
            Remarks = request.Remarks,
            GatePassId = request.GatePassId,
            Status = WorkflowStatuses.Draft,
            CreatedBy = currentUser.UserId,
            Items = request.Items.Select(item => new ChalanItem
            {
                CompanyId = request.CompanyId,
                ItemName = item.ItemName,
                UnitName = item.UnitName,
                Quantity = item.Quantity,
                Remarks = item.Remarks,
                CreatedBy = currentUser.UserId,
            }).ToList(),
        };
        db.Add(entity);
        AddAction(entity.CompanyId, null, SecurityReferenceTypes.Chalan, entity.Id, "ChalanCreated", entity.Remarks);
        await db.SaveChangesAsync(cancellationToken);
        return await GetChalanDtoAsync(entity.Id, cancellationToken);
    }

    private async Task<ChalanDto> ApproveChalanAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.Chalans.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("Chalan", id);
        entity.Status = WorkflowStatuses.Approved;
        AddAction(entity.CompanyId, null, SecurityReferenceTypes.Chalan, entity.Id, "ChalanApproved", null);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(SecurityEventNames.ChalanApproved, entity.CompanyId, entity.Id, entity, cancellationToken);
        return await GetChalanDtoAsync(entity.Id, cancellationToken);
    }

    private async Task<ChalanDto> CancelChalanAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.Chalans.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("Chalan", id);
        entity.Status = WorkflowStatuses.Cancelled;
        AddAction(entity.CompanyId, null, SecurityReferenceTypes.Chalan, entity.Id, "ChalanCancelled", null);
        await db.SaveChangesAsync(cancellationToken);
        return await GetChalanDtoAsync(entity.Id, cancellationToken);
    }

    public async Task<BillEntryDto> CreateAsync(CreateBillEntryRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureUniqueAsync(db.BillEntries.AnyAsync(x => x.CompanyId == request.CompanyId && x.BillNo == request.BillNo, cancellationToken), "BillNo already exists for this company.");
        if (request.ChalanId is not null)
        {
            _ = await db.Chalans.FirstOrDefaultAsync(x => x.Id == request.ChalanId && x.CompanyId == request.CompanyId, cancellationToken)
                ?? throw NotFound("Chalan", request.ChalanId.Value);
        }

        var entity = new BillEntry
        {
            CompanyId = request.CompanyId,
            BillNo = request.BillNo,
            BillDate = request.BillDate,
            BillType = request.BillType,
            SupplierId = request.SupplierId,
            ChalanId = request.ChalanId,
            GatePassId = request.GatePassId,
            Amount = request.Amount,
            VATAmount = request.VATAmount,
            TotalAmount = request.TotalAmount,
            Description = request.Description,
            Status = WorkflowStatuses.Pending,
            CreatedBy = currentUser.UserId,
        };
        db.Add(entity);
        AddAction(entity.CompanyId, null, SecurityReferenceTypes.BillEntry, entity.Id, "BillEntryCreated", entity.Description);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<BillEntryDto>(entity);
    }

    private async Task<BillEntryDto> ApproveBillEntryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.BillEntries.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("BillEntry", id);
        entity.Status = WorkflowStatuses.Approved;
        entity.ApprovedBy = currentUser.UserId;
        entity.ApprovedAt = BusinessTime.Now;
        AddAction(entity.CompanyId, null, SecurityReferenceTypes.BillEntry, entity.Id, "BillEntryApproved", null);
        await db.SaveChangesAsync(cancellationToken);
        await PublishAsync(SecurityEventNames.BillEntryApproved, entity.CompanyId, entity.Id, entity, cancellationToken);
        return mapper.Map<BillEntryDto>(entity);
    }

    public async Task<BillEntryDto> RejectAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.BillEntries.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("BillEntry", id);
        entity.Status = WorkflowStatuses.Rejected;
        AddAction(entity.CompanyId, null, SecurityReferenceTypes.BillEntry, entity.Id, "BillEntryRejected", null);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<BillEntryDto>(entity);
    }

    public async Task<BillEntryDto> SendToAccountsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.BillEntries.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("BillEntry", id);
        if (entity.Status != WorkflowStatuses.Approved)
        {
            throw new InvalidOperationException("Bill entry can be sent to AccountsService only after approval.");
        }

        await accountsClient.CreatePayableFromBillEntryAsync(entity.CompanyId, entity.Id, cancellationToken);
        entity.Status = WorkflowStatuses.SentToAccounts;
        AddAction(entity.CompanyId, null, SecurityReferenceTypes.BillEntry, entity.Id, "BillEntrySentToAccounts", null);
        await db.SaveChangesAsync(cancellationToken);
        var payload = new BillEntrySentToAccountsPayload(SecurityEventNames.BillEntrySentToAccounts, entity.CompanyId, entity.Id, entity.BillNo, entity.SupplierId, entity.Amount, entity.TotalAmount, entity.BillDate);
        await PublishAsync(SecurityEventNames.BillEntrySentToAccounts, entity.CompanyId, entity.Id, payload, cancellationToken);
        return mapper.Map<BillEntryDto>(entity);
    }

    public async Task<SecurityCheckLogDto> CreateAsync(CreateSecurityCheckRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureGateAsync(request.CompanyId, request.GateId, cancellationToken);
        var entity = new SecurityCheckLog
        {
            CompanyId = request.CompanyId,
            GateId = request.GateId,
            ReferenceType = request.ReferenceType,
            ReferenceId = request.ReferenceId,
            CheckTime = request.CheckTime,
            CheckedBy = currentUser.UserId,
            CheckResult = request.CheckResult,
            Remarks = request.Remarks,
            CreatedBy = currentUser.UserId,
        };
        db.Add(entity);
        AddAction(entity.CompanyId, entity.GateId, request.ReferenceType, request.ReferenceId, $"SecurityCheck{request.CheckResult}", request.Remarks);
        if (request.CheckResult is CheckResults.Failed or CheckResults.Hold)
        {
            await HoldReferenceAsync(request.ReferenceType, request.ReferenceId, cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<SecurityCheckLogDto>(entity);
    }

    private async Task<GatePassDto> UpdateGatePassStatusAsync(Guid id, string? expectedStatus, string newStatus, string action, string? eventName, CancellationToken cancellationToken)
    {
        var entity = await db.GatePasses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken) ?? throw NotFound("GatePass", id);
        if (entity.Status == GatePassStatuses.Completed && newStatus != GatePassStatuses.Completed)
        {
            throw new InvalidOperationException("Completed gate pass cannot be edited.");
        }

        if (expectedStatus is not null && entity.Status != expectedStatus)
        {
            throw new InvalidOperationException($"Gate pass must be {expectedStatus} before {newStatus}.");
        }

        entity.Status = newStatus;
        AddAction(entity.CompanyId, entity.GateId, SecurityReferenceTypes.GatePass, entity.Id, action, null);
        await db.SaveChangesAsync(cancellationToken);
        if (eventName is not null)
        {
            await PublishAsync(eventName, entity.CompanyId, entity.Id, entity, cancellationToken);
        }

        return await GetGatePassDtoAsync(entity.Id, cancellationToken);
    }

    private async Task HoldReferenceAsync(string referenceType, Guid referenceId, CancellationToken cancellationToken)
    {
        if (referenceType == SecurityReferenceTypes.GatePass)
        {
            var gatePass = await db.GatePasses.FirstOrDefaultAsync(x => x.Id == referenceId, cancellationToken);
            if (gatePass is not null) gatePass.Status = GatePassStatuses.Hold;
        }
        else if (referenceType == SecurityReferenceTypes.Chalan)
        {
            var chalan = await db.Chalans.FirstOrDefaultAsync(x => x.Id == referenceId, cancellationToken);
            if (chalan is not null) chalan.Status = WorkflowStatuses.Hold;
        }
    }

    private async Task<GatePassDto> GetGatePassDtoAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await db.GatePasses.Include(x => x.Items).FirstAsync(x => x.Id == id, cancellationToken);
        return mapper.Map<GatePassDto>(entity);
    }

    private async Task<ChalanDto> GetChalanDtoAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await db.Chalans.Include(x => x.Items).FirstAsync(x => x.Id == id, cancellationToken);
        return mapper.Map<ChalanDto>(entity);
    }

    private async Task EnsureGateAsync(Guid companyId, Guid gateId, CancellationToken cancellationToken)
    {
        var exists = await db.Gates.AnyAsync(x => x.Id == gateId && x.CompanyId == companyId && x.IsActive, cancellationToken);
        if (!exists)
        {
            throw NotFound("Active gate", gateId);
        }
    }

    private static async Task EnsureUniqueAsync(Task<bool> existsTask, string message)
    {
        if (await existsTask)
        {
            throw new InvalidOperationException(message);
        }
    }

    private void AddAction(Guid companyId, Guid? gateId, string referenceType, Guid referenceId, string actionName, string? remarks)
    {
        db.Add(new GateActionLog
        {
            CompanyId = companyId,
            GateId = gateId,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            ActionName = actionName,
            ActorUserId = currentUser.UserId,
            Remarks = remarks,
        });
    }

    private Task PublishAsync(string eventName, Guid companyId, Guid entityId, object payload, CancellationToken cancellationToken) =>
        publisher.PublishAsync(new IntegrationEvent(eventName, companyId, entityId, BusinessTime.Now, payload), cancellationToken);

    private static KeyNotFoundException NotFound(string entityName, Guid id) => new($"{entityName} '{id}' was not found.");
}
