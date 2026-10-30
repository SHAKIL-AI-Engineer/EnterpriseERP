using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewingService.Application;
using SewingService.Contracts;
using SewingService.Domain;

namespace SewingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/production-assignments")]
public sealed class ProductionAssignmentsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = SewingPermissions.AssignmentManage)]
    public async Task<ActionResult<ApiResponse<ProductionAssignmentDto>>> Create(CreateProductionAssignmentRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ProductionAssignmentDto>.Ok(await mediator.Send(new CreateProductionAssignmentCommand(request), ct)));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductionAssignmentDto>>>> Get(
        [FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default) =>
        Ok(ApiResponse<IReadOnlyList<ProductionAssignmentDto>>.Ok(await mediator.Send(new GetProductionAssignmentsQuery(companyId, orderId, page, pageSize), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<ProductionAssignmentDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<ProductionAssignmentDto>.Ok(await mediator.Send(new GetProductionAssignmentByIdQuery(id), ct)));

    [HttpPut("{id:guid}"), Authorize(Policy = SewingPermissions.AssignmentManage)]
    public async Task<ActionResult<ApiResponse<ProductionAssignmentDto>>> Update(Guid id, UpdateProductionAssignmentRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ProductionAssignmentDto>.Ok(await mediator.Send(new UpdateProductionAssignmentCommand(id, request), ct)));

    [HttpPatch("{id:guid}/activate"), Authorize(Policy = SewingPermissions.AssignmentManage)]
    public async Task<ActionResult<ApiResponse<ProductionAssignmentDto>>> Activate(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<ProductionAssignmentDto>.Ok(await mediator.Send(new ActivateProductionAssignmentCommand(id), ct)));

    [HttpDelete("{id:guid}"), Authorize(Policy = SewingPermissions.AssignmentManage)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteProductionAssignmentCommand(id), ct);
        return Ok(ApiResponse<object>.Ok(new object(), "Deleted."));
    }

    [HttpGet("daily-records"), Authorize]
    public async Task<ActionResult<ApiResponse<DailyProductionRecordDto?>>> GetDailyRecord(
        [FromQuery] Guid assignmentId, [FromQuery] DateOnly date, CancellationToken ct) =>
        Ok(ApiResponse<DailyProductionRecordDto?>.Ok(await mediator.Send(new GetDailyProductionRecordQuery(assignmentId, date), ct)));

    [HttpPost("daily-records"), Authorize(Policy = SewingPermissions.DailyRecordManage)]
    public async Task<ActionResult<ApiResponse<DailyProductionRecordDto>>> SaveDailyRecord(SaveDailyProductionRecordRequest request, CancellationToken ct) =>
        Ok(ApiResponse<DailyProductionRecordDto>.Ok(await mediator.Send(new SaveDailyProductionRecordCommand(request), ct)));

    [HttpDelete("daily-records"), Authorize(Policy = SewingPermissions.DailyRecordManage)]
    public async Task<ActionResult<ApiResponse<object>>> DeleteDailyRecord([FromQuery] Guid assignmentId, [FromQuery] DateOnly date, CancellationToken ct)
    {
        await mediator.Send(new DeleteDailyProductionRecordCommand(assignmentId, date), ct);
        return Ok(ApiResponse<object>.Ok(new object(), "Deleted."));
    }

    [HttpGet("reports/daily"), Authorize(Policy = SewingPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DailyReportRowDto>>>> DailyReport(
        [FromQuery] Guid companyId, [FromQuery] DateOnly date, [FromQuery] Guid? lineId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<DailyReportRowDto>>.Ok(await mediator.Send(new GetDailyReportQuery(companyId, date, lineId), ct)));

    [HttpGet("reports/monthly"), Authorize(Policy = SewingPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MonthlyReportRowDto>>>> MonthlyReport(
        [FromQuery] Guid companyId, [FromQuery] int year, [FromQuery] int month, [FromQuery] Guid? lineId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<MonthlyReportRowDto>>.Ok(await mediator.Send(new GetMonthlyReportQuery(companyId, year, month, lineId), ct)));
}
