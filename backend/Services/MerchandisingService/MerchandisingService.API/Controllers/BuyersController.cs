using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/buyers")]
public sealed class BuyersController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> Create(CreateBuyerRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new CreateBuyerCommand(request), cancellationToken), "Buyer created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BuyerDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BuyerDto>>.Ok(await mediator.Send(new GetBuyersQuery(companyId), cancellationToken)));

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new GetBuyerByIdQuery(companyId, id), cancellationToken)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> Update(Guid id, UpdateBuyerRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new UpdateBuyerCommand(id, request), cancellationToken), "Buyer updated."));

    [HttpPatch("{id:guid}/activate")]
    [Authorize(Policy = MerchandisingPolicies.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> Activate(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new ActivateBuyerCommand(id, true), cancellationToken), "Buyer activated."));

    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Policy = MerchandisingPolicies.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerDto>>> Deactivate(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerDto>.Ok(await mediator.Send(new ActivateBuyerCommand(id, false), cancellationToken), "Buyer deactivated."));

    [HttpGet("{buyerId:guid}/contacts")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BuyerContactDto>>>> GetContacts(Guid buyerId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BuyerContactDto>>.Ok(await mediator.Send(new GetBuyerContactsQuery(buyerId), cancellationToken)));

    [HttpPost("contacts")]
    [Authorize(Policy = MerchandisingPolicies.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerContactDto>>> CreateContact(CreateBuyerContactRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerContactDto>.Ok(await mediator.Send(new CreateBuyerContactCommand(request), cancellationToken), "Buyer contact created."));

    [HttpGet("{buyerId:guid}/payment-terms")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BuyerPaymentTermDto>>>> GetPaymentTerms(Guid buyerId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BuyerPaymentTermDto>>.Ok(await mediator.Send(new GetBuyerPaymentTermsQuery(buyerId), cancellationToken)));

    [HttpPost("payment-terms")]
    [Authorize(Policy = MerchandisingPolicies.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerPaymentTermDto>>> CreatePaymentTerm(CreateBuyerPaymentTermRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerPaymentTermDto>.Ok(await mediator.Send(new CreateBuyerPaymentTermCommand(request), cancellationToken), "Buyer payment term created."));

    [HttpGet("{buyerId:guid}/compliance-rules")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BuyerComplianceRuleDto>>>> GetComplianceRules(Guid buyerId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BuyerComplianceRuleDto>>.Ok(await mediator.Send(new GetBuyerComplianceRulesQuery(buyerId), cancellationToken)));

    [HttpPost("compliance-rules")]
    [Authorize(Policy = MerchandisingPolicies.BuyerManage)]
    public async Task<ActionResult<ApiResponse<BuyerComplianceRuleDto>>> CreateComplianceRule(CreateBuyerComplianceRuleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerComplianceRuleDto>.Ok(await mediator.Send(new CreateBuyerComplianceRuleCommand(request), cancellationToken), "Buyer compliance rule created."));
}
