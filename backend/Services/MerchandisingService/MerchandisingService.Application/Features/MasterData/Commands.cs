using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record CreateMasterDataCommand(string Resource, CreateMasterDataRequest Request) : IRequest<MasterDataDto>;
public sealed record UpdateMasterDataCommand(string Resource, Guid Id, UpdateMasterDataRequest Request) : IRequest<MasterDataDto>;
public sealed record DeleteMasterDataCommand(string Resource, Guid Id) : IRequest<Unit>;
public sealed record ImportColorsCommand(Guid CompanyId, Stream FileStream) : IRequest<ColorImportResultDto>;
