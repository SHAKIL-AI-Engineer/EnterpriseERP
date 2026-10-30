using AutoMapper;
using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Application;

public sealed class SampleCommandHandlers(
    IUnitOfWork uow,
    IMapper mapper,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateSampleCommand, SampleDto>,
    IRequestHandler<ApproveSampleCommand, SampleDto>,
    IRequestHandler<RejectSampleCommand, SampleDto>
{
    public async Task<SampleDto> Handle(CreateSampleCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var sample = new Sample
        {
            CompanyId = request.CompanyId,
            BuyerId = request.BuyerId,
            StyleId = request.StyleId,
            SampleType = request.SampleType,
            RequestDate = request.RequestDate,
            SubmitDate = request.SubmitDate,
            Remarks = request.Remarks,
        };
        await uow.Samples.AddAsync(sample, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<SampleDto>(sample);
    }

    public async Task<SampleDto> Handle(ApproveSampleCommand command, CancellationToken cancellationToken)
    {
        var sample = await uow.Samples.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Sample not found.");
        sample.Status = SampleStatuses.Approved;
        sample.ApprovalDate = DateOnly.FromDateTime(BusinessTime.Now);
        sample.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new SampleApproved(sample.CompanyId, sample.Id, sample.StyleId), cancellationToken);
        return mapper.Map<SampleDto>(sample);
    }

    public async Task<SampleDto> Handle(RejectSampleCommand command, CancellationToken cancellationToken)
    {
        var sample = await uow.Samples.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Sample not found.");
        sample.Status = SampleStatuses.Rejected;
        sample.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<SampleDto>(sample);
    }
}

public sealed class SampleQueryHandlers(IUnitOfWork uow, IMapper mapper) :
    IRequestHandler<GetSamplesQuery, IReadOnlyList<SampleDto>>
{
    public async Task<IReadOnlyList<SampleDto>> Handle(GetSamplesQuery query, CancellationToken cancellationToken)
    {
        var samplesQuery = uow.Samples.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.StyleId.HasValue)
        {
            samplesQuery = samplesQuery.Where(x => x.StyleId == query.StyleId.Value);
        }

        var samples = await samplesQuery.OrderByDescending(x => x.RequestDate).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<SampleDto>>(samples);
    }
}
