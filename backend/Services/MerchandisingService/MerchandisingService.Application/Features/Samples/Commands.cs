using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record CreateSampleCommand(CreateSampleRequest Request) : IRequest<SampleDto>;
public sealed record ApproveSampleCommand(Guid Id) : IRequest<SampleDto>;
public sealed record RejectSampleCommand(Guid Id) : IRequest<SampleDto>;
