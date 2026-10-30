using MediatR;
using SecurityService.Contracts;

namespace SecurityService.Application;

public sealed record CreateGateCommand(CreateGateRequest Request) : IRequest<GateDto>;
public sealed record UpdateGateCommand(Guid Id, UpdateGateRequest Request) : IRequest<GateDto>;
public sealed record SetGateActiveCommand(Guid Id, bool IsActive) : IRequest<GateDto>;

public sealed record CreateVisitorCommand(CreateVisitorRequest Request) : IRequest<VisitorDto>;
public sealed record BlacklistVisitorCommand(Guid Id) : IRequest<VisitorDto>;

public sealed record CreateVisitorEntryCommand(CreateVisitorEntryRequest Request) : IRequest<VisitorEntryDto>;
public sealed record CheckoutVisitorEntryCommand(Guid Id, CheckoutVisitorEntryRequest Request) : IRequest<VisitorEntryDto>;
public sealed record CancelVisitorEntryCommand(Guid Id) : IRequest<VisitorEntryDto>;

public sealed record CreateEmployeeOutPassCommand(CreateEmployeeOutPassRequest Request) : IRequest<EmployeeOutPassDto>;
public sealed record ApproveEmployeeOutPassCommand(Guid Id) : IRequest<EmployeeOutPassDto>;
public sealed record MarkEmployeeOutCommand(Guid Id) : IRequest<EmployeeOutPassDto>;
public sealed record ReturnEmployeeOutPassCommand(Guid Id, EmployeeOutPassReturnRequest Request) : IRequest<EmployeeOutPassDto>;
public sealed record CancelEmployeeOutPassCommand(Guid Id) : IRequest<EmployeeOutPassDto>;

public sealed record CreateVehicleCommand(CreateVehicleRequest Request) : IRequest<VehicleDto>;
public sealed record CreateVehicleEntryCommand(CreateVehicleEntryRequest Request) : IRequest<VehicleEntryDto>;
public sealed record ExitVehicleEntryCommand(Guid Id, VehicleExitRequest Request) : IRequest<VehicleEntryDto>;

public sealed record CreateGatePassCommand(CreateGatePassRequest Request) : IRequest<GatePassDto>;
public sealed record SubmitGatePassCommand(Guid Id) : IRequest<GatePassDto>;
public sealed record ApproveGatePassCommand(Guid Id) : IRequest<GatePassDto>;
public sealed record IssueGatePassCommand(Guid Id) : IRequest<GatePassDto>;
public sealed record CompleteGatePassCommand(Guid Id) : IRequest<GatePassDto>;
public sealed record CancelGatePassCommand(Guid Id) : IRequest<GatePassDto>;

public sealed record CreateReturnableGatePassReturnCommand(CreateReturnableGatePassReturnRequest Request) : IRequest<ReturnableGatePassReturnDto>;

public sealed record CreateChalanCommand(CreateChalanRequest Request) : IRequest<ChalanDto>;
public sealed record ApproveChalanCommand(Guid Id) : IRequest<ChalanDto>;
public sealed record CancelChalanCommand(Guid Id) : IRequest<ChalanDto>;

public sealed record CreateBillEntryCommand(CreateBillEntryRequest Request) : IRequest<BillEntryDto>;
public sealed record ApproveBillEntryCommand(Guid Id) : IRequest<BillEntryDto>;
public sealed record RejectBillEntryCommand(Guid Id) : IRequest<BillEntryDto>;
public sealed record SendBillEntryToAccountsCommand(Guid Id) : IRequest<BillEntryDto>;

public sealed record CreateSecurityCheckCommand(CreateSecurityCheckRequest Request) : IRequest<SecurityCheckLogDto>;
public sealed record ExportGateReportCommand(ReportExportApiRequest Request) : IRequest<ExportResultDto>;
