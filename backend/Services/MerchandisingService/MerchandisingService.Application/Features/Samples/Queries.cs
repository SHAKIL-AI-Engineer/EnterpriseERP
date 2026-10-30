using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record GetSamplesQuery(Guid CompanyId, Guid? StyleId) : IRequest<IReadOnlyList<SampleDto>>;
