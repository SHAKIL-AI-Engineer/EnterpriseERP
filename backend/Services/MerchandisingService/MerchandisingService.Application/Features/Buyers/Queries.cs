using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record GetBuyersQuery(Guid CompanyId) : IRequest<IReadOnlyList<BuyerDto>>;
public sealed record GetBuyerByIdQuery(Guid CompanyId, Guid Id) : IRequest<BuyerDto>;
