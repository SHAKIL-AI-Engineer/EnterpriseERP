using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record GetMasterDataListQuery(string Resource, Guid CompanyId) : IRequest<IReadOnlyList<MasterDataDto>>;
public sealed record GetMasterDataByIdQuery(string Resource, Guid CompanyId, Guid Id) : IRequest<MasterDataDto>;
public sealed record GetColorImportTemplateQuery() : IRequest<byte[]>;
