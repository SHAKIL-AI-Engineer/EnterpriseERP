using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecurityService.Application;
using SecurityService.Contracts;
using SecurityService.Domain;

namespace SecurityService.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
public abstract class SecurityControllerBase(IMediator mediator) : ControllerBase
{
    protected IMediator Mediator { get; } = mediator;
    protected IActionResult OkResponse<T>(T data, string message = "Success") => Ok(ApiResponse<T>.Ok(data, message));
}

[Route("api/v{version:apiVersion}/gates")]
public sealed class GatesController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.GateManage)]
    public async Task<IActionResult> Create(CreateGateRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateGateCommand(request), ct), "Gate created.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, CancellationToken ct) => OkResponse(await Mediator.Send(new GetGatesQuery(companyId), ct));

    [HttpPut("{id:guid}"), Authorize(Policy = SecurityPermissions.GateManage)]
    public async Task<IActionResult> Update(Guid id, UpdateGateRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new UpdateGateCommand(id, request), ct), "Gate updated.");

    [HttpPatch("{id:guid}/activate"), Authorize(Policy = SecurityPermissions.GateManage)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new SetGateActiveCommand(id, true), ct), "Gate activated.");

    [HttpPatch("{id:guid}/deactivate"), Authorize(Policy = SecurityPermissions.GateManage)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new SetGateActiveCommand(id, false), ct), "Gate deactivated.");
}

[Route("api/v{version:apiVersion}/visitors")]
public sealed class VisitorsController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.VisitorEntryCreate)]
    public async Task<IActionResult> Create(CreateVisitorRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateVisitorCommand(request), ct), "Visitor created.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] string? phone, CancellationToken ct) => OkResponse(await Mediator.Send(new GetVisitorsQuery(companyId, phone), ct));

    [HttpGet("{id:guid}"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new GetVisitorByIdQuery(id), ct));

    [HttpPatch("{id:guid}/blacklist"), Authorize(Policy = SecurityPermissions.GateManage)]
    public async Task<IActionResult> Blacklist(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new BlacklistVisitorCommand(id), ct), "Visitor blacklisted.");
}

[Route("api/v{version:apiVersion}/visitor-entries")]
public sealed class VisitorEntriesController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.VisitorEntryCreate)]
    public async Task<IActionResult> Create(CreateVisitorEntryRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateVisitorEntryCommand(request), ct), "Visitor checked in.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] DateOnly? date, CancellationToken ct) => OkResponse(await Mediator.Send(new GetVisitorEntriesQuery(companyId, date), ct));

    [HttpGet("{id:guid}"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new GetVisitorEntryByIdQuery(id), ct));

    [HttpPatch("{id:guid}/checkout"), Authorize(Policy = SecurityPermissions.VisitorCheckout)]
    public async Task<IActionResult> Checkout(Guid id, CheckoutVisitorEntryRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CheckoutVisitorEntryCommand(id, request), ct), "Visitor checked out.");

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = SecurityPermissions.VisitorCheckout)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new CancelVisitorEntryCommand(id), ct), "Visitor entry cancelled.");
}

[Route("api/v{version:apiVersion}/employee-out-passes")]
public sealed class EmployeeOutPassesController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.EmployeeOutPassCreate)]
    public async Task<IActionResult> Create(CreateEmployeeOutPassRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateEmployeeOutPassCommand(request), ct), "Employee out pass created.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] Guid? employeeId, [FromQuery] DateOnly? date, CancellationToken ct) => OkResponse(await Mediator.Send(new GetEmployeeOutPassesQuery(companyId, employeeId, date), ct));

    [HttpPatch("{id:guid}/approve"), Authorize(Policy = SecurityPermissions.EmployeeOutPassApprove)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new ApproveEmployeeOutPassCommand(id), ct), "Employee out pass approved.");

    [HttpPatch("{id:guid}/out"), Authorize(Policy = SecurityPermissions.EmployeeOutPassCreate)]
    public async Task<IActionResult> MarkOut(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new MarkEmployeeOutCommand(id), ct), "Employee marked out.");

    [HttpPatch("{id:guid}/return"), Authorize(Policy = SecurityPermissions.EmployeeOutPassCreate)]
    public async Task<IActionResult> Return(Guid id, EmployeeOutPassReturnRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new ReturnEmployeeOutPassCommand(id, request), ct), "Employee returned.");

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = SecurityPermissions.EmployeeOutPassCreate)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new CancelEmployeeOutPassCommand(id), ct), "Employee out pass cancelled.");
}

[Route("api/v{version:apiVersion}/vehicles")]
public sealed class VehiclesController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.VehicleEntryCreate)]
    public async Task<IActionResult> Create(CreateVehicleRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateVehicleCommand(request), ct), "Vehicle created.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, CancellationToken ct) => OkResponse(await Mediator.Send(new GetVehiclesQuery(companyId), ct));
}

[Route("api/v{version:apiVersion}/vehicle-entries")]
public sealed class VehicleEntriesController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.VehicleEntryCreate)]
    public async Task<IActionResult> Create(CreateVehicleEntryRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateVehicleEntryCommand(request), ct), "Vehicle entered.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] DateOnly? date, CancellationToken ct) => OkResponse(await Mediator.Send(new GetVehicleEntriesQuery(companyId, date), ct));

    [HttpPatch("{id:guid}/exit"), Authorize(Policy = SecurityPermissions.VehicleExit)]
    public async Task<IActionResult> Exit(Guid id, VehicleExitRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new ExitVehicleEntryCommand(id, request), ct), "Vehicle exited.");
}

[Route("api/v{version:apiVersion}/gate-passes")]
public sealed class GatePassesController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.GatePassCreate)]
    public async Task<IActionResult> Create(CreateGatePassRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateGatePassCommand(request), ct), "Gate pass created.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] string? type, [FromQuery] string? status, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => OkResponse(await Mediator.Send(new GetGatePassesQuery(companyId, type, status, fromDate, toDate), ct));

    [HttpGet("{id:guid}"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new GetGatePassByIdQuery(id), ct));

    [HttpPatch("{id:guid}/submit"), Authorize(Policy = SecurityPermissions.GatePassCreate)]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new SubmitGatePassCommand(id), ct), "Gate pass submitted.");

    [HttpPatch("{id:guid}/approve"), Authorize(Policy = SecurityPermissions.GatePassApprove)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new ApproveGatePassCommand(id), ct), "Gate pass approved.");

    [HttpPatch("{id:guid}/issue"), Authorize(Policy = SecurityPermissions.GatePassIssue)]
    public async Task<IActionResult> Issue(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new IssueGatePassCommand(id), ct), "Gate pass issued.");

    [HttpPatch("{id:guid}/complete"), Authorize(Policy = SecurityPermissions.GatePassIssue)]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new CompleteGatePassCommand(id), ct), "Gate pass completed.");

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = SecurityPermissions.GatePassCreate)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new CancelGatePassCommand(id), ct), "Gate pass cancelled.");
}

[Route("api/v{version:apiVersion}/returnable-gate-pass-returns")]
public sealed class ReturnableGatePassReturnsController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.GatePassIssue)]
    public async Task<IActionResult> Create(CreateReturnableGatePassReturnRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateReturnableGatePassReturnCommand(request), ct), "Return recorded.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] Guid? gatePassId, CancellationToken ct) => OkResponse(await Mediator.Send(new GetReturnableGatePassReturnsQuery(companyId, gatePassId), ct));
}

[Route("api/v{version:apiVersion}/chalans")]
public sealed class ChalansController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.ChalanCreate)]
    public async Task<IActionResult> Create(CreateChalanRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateChalanCommand(request), ct), "Chalan created.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] string? type, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => OkResponse(await Mediator.Send(new GetChalansQuery(companyId, type, fromDate, toDate), ct));

    [HttpGet("{id:guid}"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new GetChalanByIdQuery(id), ct));

    [HttpPatch("{id:guid}/approve"), Authorize(Policy = SecurityPermissions.ChalanApprove)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new ApproveChalanCommand(id), ct), "Chalan approved.");

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = SecurityPermissions.ChalanCreate)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new CancelChalanCommand(id), ct), "Chalan cancelled.");
}

[Route("api/v{version:apiVersion}/bill-entries")]
public sealed class BillEntriesController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.BillEntryCreate)]
    public async Task<IActionResult> Create(CreateBillEntryRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateBillEntryCommand(request), ct), "Bill entry created.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => OkResponse(await Mediator.Send(new GetBillEntriesQuery(companyId, fromDate, toDate), ct));

    [HttpGet("{id:guid}"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new GetBillEntryByIdQuery(id), ct));

    [HttpPatch("{id:guid}/approve"), Authorize(Policy = SecurityPermissions.BillEntryApprove)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new ApproveBillEntryCommand(id), ct), "Bill entry approved.");

    [HttpPatch("{id:guid}/reject"), Authorize(Policy = SecurityPermissions.BillEntryApprove)]
    public async Task<IActionResult> Reject(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new RejectBillEntryCommand(id), ct), "Bill entry rejected.");

    [HttpPatch("{id:guid}/send-to-accounts"), Authorize(Policy = SecurityPermissions.BillSendToAccounts)]
    public async Task<IActionResult> SendToAccounts(Guid id, CancellationToken ct) => OkResponse(await Mediator.Send(new SendBillEntryToAccountsCommand(id), ct), "Bill entry sent to AccountsService.");
}

[Route("api/v{version:apiVersion}/security-checks")]
public sealed class SecurityChecksController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpPost, Authorize(Policy = SecurityPermissions.SecurityCheckCreate)]
    public async Task<IActionResult> Create(CreateSecurityCheckRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new CreateSecurityCheckCommand(request), ct), "Security check recorded.");

    [HttpGet, Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] string? referenceType, [FromQuery] Guid? referenceId, CancellationToken ct) => OkResponse(await Mediator.Send(new GetSecurityChecksQuery(companyId, referenceType, referenceId), ct));
}

[Route("api/v{version:apiVersion}/gate-reports")]
public sealed class GateReportsController(IMediator mediator) : SecurityControllerBase(mediator)
{
    [HttpGet("daily-register"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> DailyRegister([FromQuery] Guid companyId, [FromQuery] DateOnly date, CancellationToken ct) => OkResponse(await Mediator.Send(new GetDailyGateRegisterQuery(companyId, date), ct));

    [HttpGet("visitor-report"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> VisitorReport([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) => OkResponse(await Mediator.Send(new GetVisitorReportQuery(companyId, fromDate, toDate), ct));

    [HttpGet("material-in-out"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> MaterialInOut([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) => OkResponse(await Mediator.Send(new GetMaterialInOutReportQuery(companyId, fromDate, toDate), ct));

    [HttpGet("vehicle-report"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> VehicleReport([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) => OkResponse(await Mediator.Send(new GetVehicleReportQuery(companyId, fromDate, toDate), ct));

    [HttpGet("returnable-pending"), Authorize(Policy = SecurityPermissions.GateReportView)]
    public async Task<IActionResult> ReturnablePending([FromQuery] Guid companyId, CancellationToken ct) => OkResponse(await Mediator.Send(new GetReturnablePendingReportQuery(companyId), ct));

    [HttpPost("export"), Authorize(Policy = SecurityPermissions.GateReportExport)]
    public async Task<IActionResult> Export(ReportExportApiRequest request, CancellationToken ct) => OkResponse(await Mediator.Send(new ExportGateReportCommand(request), ct), "Export requested.");
}
