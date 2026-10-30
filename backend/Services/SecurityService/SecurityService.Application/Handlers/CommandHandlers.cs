using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SecurityService.Contracts;
using SecurityService.Domain;

namespace SecurityService.Application.Handlers;

public sealed class CommandHandlers(
    ISecurityDbContext db,
    IMapper mapper,
    ICurrentUserService currentUser,
    IVisitorEntryService visitorEntries,
    IEmployeeOutPassService employeeOutPasses,
    IVehicleEntryService vehicleEntries,
    IGatePassService gatePasses,
    IChalanService chalans,
    IBillEntryService billEntries,
    ISecurityCheckService securityChecks,
    IReportDataBuilderService reports)
    : IRequestHandler<CreateGateCommand, GateDto>,
      IRequestHandler<UpdateGateCommand, GateDto>,
      IRequestHandler<SetGateActiveCommand, GateDto>,
      IRequestHandler<CreateVisitorCommand, VisitorDto>,
      IRequestHandler<BlacklistVisitorCommand, VisitorDto>,
      IRequestHandler<CreateVisitorEntryCommand, VisitorEntryDto>,
      IRequestHandler<CheckoutVisitorEntryCommand, VisitorEntryDto>,
      IRequestHandler<CancelVisitorEntryCommand, VisitorEntryDto>,
      IRequestHandler<CreateEmployeeOutPassCommand, EmployeeOutPassDto>,
      IRequestHandler<ApproveEmployeeOutPassCommand, EmployeeOutPassDto>,
      IRequestHandler<MarkEmployeeOutCommand, EmployeeOutPassDto>,
      IRequestHandler<ReturnEmployeeOutPassCommand, EmployeeOutPassDto>,
      IRequestHandler<CancelEmployeeOutPassCommand, EmployeeOutPassDto>,
      IRequestHandler<CreateVehicleCommand, VehicleDto>,
      IRequestHandler<CreateVehicleEntryCommand, VehicleEntryDto>,
      IRequestHandler<ExitVehicleEntryCommand, VehicleEntryDto>,
      IRequestHandler<CreateGatePassCommand, GatePassDto>,
      IRequestHandler<SubmitGatePassCommand, GatePassDto>,
      IRequestHandler<ApproveGatePassCommand, GatePassDto>,
      IRequestHandler<IssueGatePassCommand, GatePassDto>,
      IRequestHandler<CompleteGatePassCommand, GatePassDto>,
      IRequestHandler<CancelGatePassCommand, GatePassDto>,
      IRequestHandler<CreateReturnableGatePassReturnCommand, ReturnableGatePassReturnDto>,
      IRequestHandler<CreateChalanCommand, ChalanDto>,
      IRequestHandler<ApproveChalanCommand, ChalanDto>,
      IRequestHandler<CancelChalanCommand, ChalanDto>,
      IRequestHandler<CreateBillEntryCommand, BillEntryDto>,
      IRequestHandler<ApproveBillEntryCommand, BillEntryDto>,
      IRequestHandler<RejectBillEntryCommand, BillEntryDto>,
      IRequestHandler<SendBillEntryToAccountsCommand, BillEntryDto>,
      IRequestHandler<CreateSecurityCheckCommand, SecurityCheckLogDto>,
      IRequestHandler<ExportGateReportCommand, ExportResultDto>
{
    public async Task<GateDto> Handle(CreateGateCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        if (await db.Gates.AnyAsync(x => x.CompanyId == request.CompanyId && x.GateCode == request.GateCode, cancellationToken))
        {
            throw new InvalidOperationException("GateCode already exists for this company.");
        }

        var entity = new Gate
        {
            CompanyId = request.CompanyId,
            GateCode = request.GateCode,
            GateName = request.GateName,
            LocationName = request.LocationName,
            CreatedBy = currentUser.UserId,
        };
        db.Add(entity);
        AddAction(entity.CompanyId, entity.Id, "Gate", entity.Id, "GateCreated", entity.GateName);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<GateDto>(entity);
    }

    public async Task<GateDto> Handle(UpdateGateCommand command, CancellationToken cancellationToken)
    {
        var entity = await db.Gates.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken) ?? NotFound<Gate>(command.Id);
        if (await db.Gates.AnyAsync(x => x.Id != command.Id && x.CompanyId == entity.CompanyId && x.GateCode == command.Request.GateCode, cancellationToken))
        {
            throw new InvalidOperationException("GateCode already exists for this company.");
        }

        entity.GateCode = command.Request.GateCode;
        entity.GateName = command.Request.GateName;
        entity.LocationName = command.Request.LocationName;
        entity.IsActive = command.Request.IsActive;
        AddAction(entity.CompanyId, entity.Id, "Gate", entity.Id, "GateUpdated", null);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<GateDto>(entity);
    }

    public async Task<GateDto> Handle(SetGateActiveCommand command, CancellationToken cancellationToken)
    {
        var entity = await db.Gates.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken) ?? NotFound<Gate>(command.Id);
        entity.IsActive = command.IsActive;
        AddAction(entity.CompanyId, entity.Id, "Gate", entity.Id, command.IsActive ? "GateActivated" : "GateDeactivated", null);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<GateDto>(entity);
    }

    public async Task<VisitorDto> Handle(CreateVisitorCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var entity = new Visitor
        {
            CompanyId = request.CompanyId,
            VisitorName = request.VisitorName,
            Phone = request.Phone,
            NIDNo = request.NIDNo,
            CompanyName = request.CompanyName,
            Address = request.Address,
            PhotoUrl = request.PhotoUrl,
            CreatedBy = currentUser.UserId,
        };
        db.Add(entity);
        AddAction(entity.CompanyId, null, "Visitor", entity.Id, "VisitorCreated", entity.VisitorName);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<VisitorDto>(entity);
    }

    public async Task<VisitorDto> Handle(BlacklistVisitorCommand command, CancellationToken cancellationToken)
    {
        var entity = await db.Visitors.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken) ?? NotFound<Visitor>(command.Id);
        entity.IsBlacklisted = true;
        AddAction(entity.CompanyId, null, "Visitor", entity.Id, "VisitorBlacklisted", entity.VisitorName);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<VisitorDto>(entity);
    }

    public Task<VisitorEntryDto> Handle(CreateVisitorEntryCommand command, CancellationToken cancellationToken) => visitorEntries.CreateAsync(command.Request, cancellationToken);
    public Task<VisitorEntryDto> Handle(CheckoutVisitorEntryCommand command, CancellationToken cancellationToken) => visitorEntries.CheckoutAsync(command.Id, command.Request.OutTime, cancellationToken);
    public Task<VisitorEntryDto> Handle(CancelVisitorEntryCommand command, CancellationToken cancellationToken) => visitorEntries.CancelAsync(command.Id, cancellationToken);
    public Task<EmployeeOutPassDto> Handle(CreateEmployeeOutPassCommand command, CancellationToken cancellationToken) => employeeOutPasses.CreateAsync(command.Request, cancellationToken);
    public Task<EmployeeOutPassDto> Handle(ApproveEmployeeOutPassCommand command, CancellationToken cancellationToken) => employeeOutPasses.ApproveAsync(command.Id, cancellationToken);
    public Task<EmployeeOutPassDto> Handle(MarkEmployeeOutCommand command, CancellationToken cancellationToken) => employeeOutPasses.MarkOutAsync(command.Id, cancellationToken);
    public Task<EmployeeOutPassDto> Handle(ReturnEmployeeOutPassCommand command, CancellationToken cancellationToken) => employeeOutPasses.MarkReturnedAsync(command.Id, command.Request.ActualReturnTime, cancellationToken);
    public Task<EmployeeOutPassDto> Handle(CancelEmployeeOutPassCommand command, CancellationToken cancellationToken) => employeeOutPasses.CancelAsync(command.Id, cancellationToken);

    public async Task<VehicleDto> Handle(CreateVehicleCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var entity = new Vehicle
        {
            CompanyId = request.CompanyId,
            VehicleNo = request.VehicleNo,
            VehicleType = request.VehicleType,
            DriverName = request.DriverName,
            DriverPhone = request.DriverPhone,
            CreatedBy = currentUser.UserId,
        };
        db.Add(entity);
        AddAction(entity.CompanyId, null, "Vehicle", entity.Id, "VehicleCreated", entity.VehicleNo);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<VehicleDto>(entity);
    }

    public Task<VehicleEntryDto> Handle(CreateVehicleEntryCommand command, CancellationToken cancellationToken) => vehicleEntries.CreateAsync(command.Request, cancellationToken);
    public Task<VehicleEntryDto> Handle(ExitVehicleEntryCommand command, CancellationToken cancellationToken) => vehicleEntries.ExitAsync(command.Id, command.Request.OutTime, cancellationToken);
    public Task<GatePassDto> Handle(CreateGatePassCommand command, CancellationToken cancellationToken) => gatePasses.CreateAsync(command.Request, cancellationToken);
    public Task<GatePassDto> Handle(SubmitGatePassCommand command, CancellationToken cancellationToken) => gatePasses.SubmitAsync(command.Id, cancellationToken);
    public Task<GatePassDto> Handle(ApproveGatePassCommand command, CancellationToken cancellationToken) => gatePasses.ApproveAsync(command.Id, cancellationToken);
    public Task<GatePassDto> Handle(IssueGatePassCommand command, CancellationToken cancellationToken) => gatePasses.IssueAsync(command.Id, cancellationToken);
    public Task<GatePassDto> Handle(CompleteGatePassCommand command, CancellationToken cancellationToken) => gatePasses.CompleteAsync(command.Id, cancellationToken);
    public Task<GatePassDto> Handle(CancelGatePassCommand command, CancellationToken cancellationToken) => gatePasses.CancelAsync(command.Id, cancellationToken);

    public async Task<ReturnableGatePassReturnDto> Handle(CreateReturnableGatePassReturnCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var gatePass = await db.GatePasses.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == request.GatePassId && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException($"GatePass '{request.GatePassId}' was not found.");
        if (!gatePass.IsReturnable)
        {
            throw new InvalidOperationException("Only returnable gate passes can receive returns.");
        }

        var entity = new ReturnableGatePassReturn
        {
            CompanyId = request.CompanyId,
            GatePassId = request.GatePassId,
            ReturnDate = request.ReturnDate,
            ReturnedBy = request.ReturnedBy,
            ReceivedBy = request.ReceivedBy ?? currentUser.UserId,
            Remarks = request.Remarks,
            CreatedBy = currentUser.UserId,
        };

        foreach (var item in request.Items)
        {
            var gatePassItem = gatePass.Items.FirstOrDefault(x => x.Id == item.GatePassItemId)
                ?? throw new KeyNotFoundException($"GatePassItem '{item.GatePassItemId}' was not found.");
            if (gatePassItem.ReturnedQty + item.ReturnQty > gatePassItem.Quantity)
            {
                throw new InvalidOperationException("ReturnedQty cannot exceed gate pass item quantity.");
            }

            gatePassItem.ReturnedQty += item.ReturnQty;
            entity.Items.Add(new ReturnableGatePassReturnItem
            {
                CompanyId = request.CompanyId,
                GatePassItemId = item.GatePassItemId,
                ReturnQty = item.ReturnQty,
                CreatedBy = currentUser.UserId,
            });
        }

        db.Add(entity);
        AddAction(request.CompanyId, gatePass.GateId, SecurityReferenceTypes.GatePass, gatePass.Id, "ReturnableGatePassReturned", request.Remarks);
        await db.SaveChangesAsync(cancellationToken);
        return mapper.Map<ReturnableGatePassReturnDto>(entity);
    }

    public Task<ChalanDto> Handle(CreateChalanCommand command, CancellationToken cancellationToken) => chalans.CreateAsync(command.Request, cancellationToken);
    public Task<ChalanDto> Handle(ApproveChalanCommand command, CancellationToken cancellationToken) => chalans.ApproveAsync(command.Id, cancellationToken);
    public Task<ChalanDto> Handle(CancelChalanCommand command, CancellationToken cancellationToken) => chalans.CancelAsync(command.Id, cancellationToken);
    public Task<BillEntryDto> Handle(CreateBillEntryCommand command, CancellationToken cancellationToken) => billEntries.CreateAsync(command.Request, cancellationToken);
    public Task<BillEntryDto> Handle(ApproveBillEntryCommand command, CancellationToken cancellationToken) => billEntries.ApproveAsync(command.Id, cancellationToken);
    public Task<BillEntryDto> Handle(RejectBillEntryCommand command, CancellationToken cancellationToken) => billEntries.RejectAsync(command.Id, cancellationToken);
    public Task<BillEntryDto> Handle(SendBillEntryToAccountsCommand command, CancellationToken cancellationToken) => billEntries.SendToAccountsAsync(command.Id, cancellationToken);
    public Task<SecurityCheckLogDto> Handle(CreateSecurityCheckCommand command, CancellationToken cancellationToken) => securityChecks.CreateAsync(command.Request, cancellationToken);
    public Task<ExportResultDto> Handle(ExportGateReportCommand command, CancellationToken cancellationToken) => reports.ExportAsync(command.Request, cancellationToken);

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

    private static T NotFound<T>(Guid id) => throw new KeyNotFoundException($"{typeof(T).Name} '{id}' was not found.");
}
