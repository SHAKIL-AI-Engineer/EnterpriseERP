using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record CreateSeasonCommand(CreateSeasonRequest Request) : IRequest<SeasonDto>;
public sealed record CreateGarmentItemCommand(CreateGarmentItemRequest Request) : IRequest<GarmentItemDto>;
public sealed record CreateStyleCommand(CreateStyleRequest Request) : IRequest<StyleDto>;
public sealed record UpdateStyleCommand(Guid Id, UpdateStyleRequest Request) : IRequest<StyleDto>;
