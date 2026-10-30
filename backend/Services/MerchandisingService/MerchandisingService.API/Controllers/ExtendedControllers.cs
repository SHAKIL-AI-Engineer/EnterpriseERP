using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/quotations")]
public sealed class QuotationsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.QuotationManage)]
    public async Task<ActionResult<ApiResponse<QuotationDto>>> Create(CreateQuotationRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<QuotationDto>.Ok(await mediator.Send(new CreateQuotationCommand(request), cancellationToken), "Quotation created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QuotationDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? buyerId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<QuotationDto>>.Ok(await mediator.Send(new GetQuotationsQuery(companyId, buyerId), cancellationToken)));

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<QuotationDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<QuotationDto>.Ok(await mediator.Send(new GetQuotationByIdQuery(companyId, id), cancellationToken)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.QuotationManage)]
    public async Task<ActionResult<ApiResponse<QuotationDto>>> Update(Guid id, UpdateQuotationRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<QuotationDto>.Ok(await mediator.Send(new UpdateQuotationCommand(id, request), cancellationToken), "Quotation updated."));

    [HttpGet("{id:guid}/negotiations")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QuotationNegotiationDto>>>> GetNegotiations(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<QuotationNegotiationDto>>.Ok(await mediator.Send(new GetQuotationNegotiationsQuery(companyId, id), cancellationToken)));

    [HttpPost("{id:guid}/negotiations")]
    [Authorize(Policy = MerchandisingPolicies.QuotationManage)]
    public async Task<ActionResult<ApiResponse<QuotationNegotiationDto>>> AddNegotiation(Guid id, AddQuotationNegotiationRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<QuotationNegotiationDto>.Ok(await mediator.Send(new AddQuotationNegotiationCommand(id, request), cancellationToken), "Negotiation recorded."));

    [HttpPost("{id:guid}/convert-to-order")]
    [Authorize(Policy = MerchandisingPolicies.OrderCreate)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> ConvertToOrder(Guid id, ConvertQuotationToOrderRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new ConvertQuotationToOrderCommand(id, request), cancellationToken), "Quotation converted to order."));
}

[ApiController]
[Route("api/v1/merchandising/tna")]
public sealed class TnaController(IMediator mediator) : ControllerBase
{
    [HttpPost("templates")]
    [Authorize(Policy = MerchandisingPolicies.TnaManage)]
    public async Task<ActionResult<ApiResponse<TnaTemplateDto>>> CreateTemplate(CreateTnaTemplateRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<TnaTemplateDto>.Ok(await mediator.Send(new CreateTnaTemplateCommand(request), cancellationToken), "TNA template created."));

    [HttpPost("orders/{orderId:guid}/generate")]
    [Authorize(Policy = MerchandisingPolicies.TnaManage)]
    public async Task<ActionResult<ApiResponse<TnaCalendarDto>>> Generate(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<TnaCalendarDto>.Ok(await mediator.Send(new GenerateTnaForOrderCommand(orderId), cancellationToken), "TNA calendar generated."));

    [HttpGet("orders/{orderId:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<TnaCalendarDto?>>> GetByOrder(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<TnaCalendarDto?>.Ok(await mediator.Send(new GetTnaCalendarByOrderQuery(orderId), cancellationToken)));

    [HttpPut("milestones/{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.TnaManage)]
    public async Task<ActionResult<ApiResponse<TnaMilestoneDto>>> UpdateMilestone(Guid id, UpdateTnaMilestoneRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<TnaMilestoneDto>.Ok(await mediator.Send(new UpdateTnaMilestoneCommand(id, request), cancellationToken), "TNA milestone updated."));

    [HttpPost("milestones/{id:guid}/delays")]
    [Authorize(Policy = MerchandisingPolicies.TnaManage)]
    public async Task<ActionResult<ApiResponse<TnaDelayLogDto>>> LogDelay(Guid id, LogTnaDelayRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<TnaDelayLogDto>.Ok(await mediator.Send(new LogTnaDelayCommand(id, request), cancellationToken), "TNA delay logged."));
}

[ApiController]
[Route("api/v1/merchandising/bookings")]
public sealed class BookingsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.BookingManage)]
    public async Task<ActionResult<ApiResponse<MaterialBookingDto>>> Create(CreateMaterialBookingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<MaterialBookingDto>.Ok(await mediator.Send(new CreateMaterialBookingCommand(request), cancellationToken), "Material booking created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MaterialBookingDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<MaterialBookingDto>>.Ok(await mediator.Send(new GetMaterialBookingsQuery(companyId, orderId), cancellationToken)));

    [HttpPost("{id:guid}/auto-calculate")]
    [Authorize(Policy = MerchandisingPolicies.BookingManage)]
    public async Task<ActionResult<ApiResponse<MaterialBookingDto>>> AutoCalculate(Guid id, AutoCalculateBookingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<MaterialBookingDto>.Ok(await mediator.Send(new AutoCalculateBookingCommand(id, request), cancellationToken), "Booking auto-calculated from BOM."));

    [HttpPost("{id:guid}/fabric-details")]
    [Authorize(Policy = MerchandisingPolicies.BookingManage)]
    public async Task<ActionResult<ApiResponse<FabricBookingDetailDto>>> AddFabricDetail(Guid id, CreateFabricBookingDetailRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<FabricBookingDetailDto>.Ok(await mediator.Send(new CreateFabricBookingDetailCommand(id, request), cancellationToken), "Fabric detail added."));

    [HttpPost("{id:guid}/trims-details")]
    [Authorize(Policy = MerchandisingPolicies.BookingManage)]
    public async Task<ActionResult<ApiResponse<TrimsBookingDetailDto>>> AddTrimsDetail(Guid id, CreateTrimsBookingDetailRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<TrimsBookingDetailDto>.Ok(await mediator.Send(new CreateTrimsBookingDetailCommand(id, request), cancellationToken), "Trims detail added."));

    [HttpPost("{id:guid}/allocations")]
    [Authorize(Policy = MerchandisingPolicies.BookingManage)]
    public async Task<ActionResult<ApiResponse<BookingAllocationDto>>> AddAllocation(Guid id, CreateBookingAllocationRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BookingAllocationDto>.Ok(await mediator.Send(new CreateBookingAllocationCommand(id, request), cancellationToken), "Allocation created."));
}

[ApiController]
[Route("api/v1/merchandising/requisitions")]
public sealed class RequisitionsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.RequisitionManage)]
    public async Task<ActionResult<ApiResponse<PurchaseRequisitionDto>>> Create(CreatePurchaseRequisitionRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PurchaseRequisitionDto>.Ok(await mediator.Send(new CreatePurchaseRequisitionCommand(request), cancellationToken), "Requisition created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PurchaseRequisitionDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<PurchaseRequisitionDto>>.Ok(await mediator.Send(new GetPurchaseRequisitionsQuery(companyId, orderId), cancellationToken)));

    [HttpPost("{id:guid}/submit")]
    [Authorize(Policy = MerchandisingPolicies.RequisitionManage)]
    public async Task<ActionResult<ApiResponse<PurchaseRequisitionDto>>> Submit(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PurchaseRequisitionDto>.Ok(await mediator.Send(new SubmitPurchaseRequisitionCommand(id), cancellationToken), "Requisition submitted."));

    [HttpPost("from-order/{orderId:guid}")]
    [Authorize(Policy = MerchandisingPolicies.RequisitionManage)]
    public async Task<ActionResult<ApiResponse<PurchaseRequisitionDto>>> FromOrder(Guid orderId, CreatePurchaseRequisitionRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PurchaseRequisitionDto>.Ok(await mediator.Send(new GenerateRequisitionFromOrderCommand(orderId, request), cancellationToken), "Requisition generated from order."));
}
