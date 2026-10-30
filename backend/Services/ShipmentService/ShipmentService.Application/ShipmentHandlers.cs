using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShipmentService.Contracts;
using ShipmentService.Domain;

namespace ShipmentService.Application;

public sealed record MarkFinishedGoodsReadyCommand(FinishedGoodsReadyRequest Request) : IRequest<ShipmentReadinessDto>;
public sealed record NotifyInspectionPassedCommand(NotifyInspectionPassedRequest Request) : IRequest<bool>;
public sealed record CreateShipmentExecutionCommand(CreateShipmentExecutionRequest Request) : IRequest<ShipmentExecutionDto>;
public sealed record GetShipmentExecutionsQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<ShipmentExecutionDto>>;
public sealed record GetShipmentPlanQuery(Guid CompanyId, Guid OrderId) : IRequest<ShipmentPlanSnapshotDto?>;
public sealed record GetShipmentStatusQuery(Guid CompanyId, Guid OrderId) : IRequest<string>;
public sealed record GetShipmentReportsQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<ShipmentReportRowDto>>;

public sealed class ShipmentHandlers(IUnitOfWork uow, IMapper mapper, IMerchandisingShipmentClient merch) :
    IRequestHandler<MarkFinishedGoodsReadyCommand, ShipmentReadinessDto>,
    IRequestHandler<NotifyInspectionPassedCommand, bool>,
    IRequestHandler<CreateShipmentExecutionCommand, ShipmentExecutionDto>,
    IRequestHandler<GetShipmentExecutionsQuery, IReadOnlyList<ShipmentExecutionDto>>,
    IRequestHandler<GetShipmentPlanQuery, ShipmentPlanSnapshotDto?>,
    IRequestHandler<GetShipmentStatusQuery, string>,
    IRequestHandler<GetShipmentReportsQuery, IReadOnlyList<ShipmentReportRowDto>>
{
    public async Task<ShipmentReadinessDto> Handle(MarkFinishedGoodsReadyCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var entity = new ShipmentReadiness
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            FinishedGoodsTransferId = r.TransferId,
            ReadyQty = r.ReadyQty ?? 0,
            ReadyDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Status = ShipmentExecutionStatuses.Ready,
        };
        await uow.Readiness.AddAsync(entity, ct);
        await uow.SaveChangesAsync(ct);
        return mapper.Map<ShipmentReadinessDto>(entity);
    }

    public Task<bool> Handle(NotifyInspectionPassedCommand command, CancellationToken ct) => Task.FromResult(true);

    public async Task<ShipmentExecutionDto> Handle(CreateShipmentExecutionCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var entity = new ShipmentExecution
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            MerchandisingShipmentPlanId = r.MerchandisingShipmentPlanId,
            ActualShipmentDate = r.ActualShipmentDate,
            ShippedQty = r.ShippedQty,
            Destination = r.Destination,
            Status = ShipmentExecutionStatuses.Shipped,
        };
        await uow.Executions.AddAsync(entity, ct);
        await uow.SaveChangesAsync(ct);
        return mapper.Map<ShipmentExecutionDto>(entity);
    }

    public async Task<IReadOnlyList<ShipmentExecutionDto>> Handle(GetShipmentExecutionsQuery query, CancellationToken ct)
    {
        var q = uow.Executions.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue) q = q.Where(x => x.OrderId == query.OrderId);
        return mapper.Map<IReadOnlyList<ShipmentExecutionDto>>(await q.ToListAsync(ct));
    }

    public async Task<ShipmentPlanSnapshotDto?> Handle(GetShipmentPlanQuery query, CancellationToken ct) =>
        await merch.GetPlanAsync(query.CompanyId, query.OrderId, ct);

    public async Task<string> Handle(GetShipmentStatusQuery query, CancellationToken ct)
    {
        var latest = await uow.Executions.Query().Where(x => x.CompanyId == query.CompanyId && x.OrderId == query.OrderId)
            .OrderByDescending(x => x.CreatedAt).FirstOrDefaultAsync(ct);
        return latest?.Status ?? ShipmentExecutionStatuses.Planned;
    }

    public async Task<IReadOnlyList<ShipmentReportRowDto>> Handle(GetShipmentReportsQuery query, CancellationToken ct)
    {
        var execs = await uow.Executions.Query().Where(x => x.CompanyId == query.CompanyId)
            .Where(x => !query.OrderId.HasValue || x.OrderId == query.OrderId).ToListAsync(ct);
        return execs.Select(e => new ShipmentReportRowDto("Execution", e.OrderId, e.ShippedQty, e.Status, e.ActualShipmentDate)).ToList();
    }
}

public sealed class ShipmentMappingProfile : Profile
{
    public ShipmentMappingProfile()
    {
        CreateMap<ShipmentReadiness, ShipmentReadinessDto>();
        CreateMap<ShipmentExecution, ShipmentExecutionDto>();
    }
}
