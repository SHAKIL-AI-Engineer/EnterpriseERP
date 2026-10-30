using MediatR;
using Microsoft.AspNetCore.Mvc;
using StoreService.Application;
using StoreService.Contracts;

namespace StoreService.API.Controllers;

[ApiController]
[Route("api/v1/store/bookings")]
public sealed class BookingsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StoreBookingDto>>>> Get(
        [FromQuery] Guid companyId, [FromQuery] string? type, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StoreBookingDto>>.Ok(await mediator.Send(new GetBookingsQuery(companyId, type), cancellationToken)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreBookingDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreBookingDto>.Ok(await mediator.Send(new GetBookingByIdQuery(companyId, id), cancellationToken)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoreBookingDto>>> Create(CreateStoreBookingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreBookingDto>.Ok(await mediator.Send(new CreateBookingCommand(request), cancellationToken), "Booking created."));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreBookingDto>>> Update(Guid id, [FromQuery] Guid companyId, UpdateStoreBookingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreBookingDto>.Ok(await mediator.Send(new UpdateBookingCommand(companyId, id, request), cancellationToken), "Booking updated."));

    [HttpPost("{id:guid}/issue")]
    public async Task<ActionResult<ApiResponse<StoreBookingDto>>> Issue(Guid id, [FromQuery] Guid companyId, IssueBookingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreBookingDto>.Ok(await mediator.Send(new IssueBookingCommand(companyId, id, request), cancellationToken), "Booking issued."));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteBookingCommand(companyId, id), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "Booking deleted."));
    }
}
