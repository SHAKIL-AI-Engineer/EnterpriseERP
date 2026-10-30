using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record GetSeasonsQuery(Guid CompanyId) : IRequest<IReadOnlyList<SeasonDto>>;
public sealed record GetGarmentItemsQuery(Guid CompanyId) : IRequest<IReadOnlyList<GarmentItemDto>>;
public sealed record GetStylesQuery(Guid CompanyId, Guid? BuyerId) : IRequest<IReadOnlyList<StyleDto>>;
public sealed record GetStyleByIdQuery(Guid CompanyId, Guid Id) : IRequest<StyleDto>;
