using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record CreateBuyerCommand(CreateBuyerRequest Request) : IRequest<BuyerDto>;
public sealed record UpdateBuyerCommand(Guid Id, UpdateBuyerRequest Request) : IRequest<BuyerDto>;
public sealed record ActivateBuyerCommand(Guid Id, bool IsActive) : IRequest<BuyerDto>;
