using AutoMapper;
using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Application;

public sealed class DocumentCommandHandlers(IUnitOfWork uow, IMapper mapper) :
    IRequestHandler<CreateStyleDocumentCommand, StyleDocumentDto>,
    IRequestHandler<CreateOrderDocumentCommand, OrderDocumentDto>
{
    public async Task<StyleDocumentDto> Handle(CreateStyleDocumentCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var style = await uow.Styles.GetByIdAsync(request.StyleId, cancellationToken) ?? throw new KeyNotFoundException("Style not found.");
        var doc = new StyleDocument
        {
            CompanyId = request.CompanyId,
            StyleId = style.Id,
            DocumentType = request.DocumentType,
            FileName = request.FileName.Trim(),
            FileUrl = request.FileUrl.Trim(),
            Version = request.Version,
            Remarks = request.Remarks,
        };
        await uow.StyleDocuments.AddAsync(doc, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<StyleDocumentDto>(doc);
    }

    public async Task<OrderDocumentDto> Handle(CreateOrderDocumentCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var order = await uow.Orders.GetByIdAsync(request.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var doc = new OrderDocument
        {
            CompanyId = request.CompanyId,
            OrderId = order.Id,
            DocumentType = request.DocumentType,
            FileName = request.FileName.Trim(),
            FileUrl = request.FileUrl.Trim(),
            Version = request.Version,
            Remarks = request.Remarks,
        };
        await uow.OrderDocuments.AddAsync(doc, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<OrderDocumentDto>(doc);
    }
}

public sealed class DocumentQueryHandlers(IUnitOfWork uow, IMapper mapper) :
    IRequestHandler<GetStyleDocumentsQuery, IReadOnlyList<StyleDocumentDto>>,
    IRequestHandler<GetOrderDocumentsQuery, IReadOnlyList<OrderDocumentDto>>
{
    public async Task<IReadOnlyList<StyleDocumentDto>> Handle(GetStyleDocumentsQuery query, CancellationToken cancellationToken)
    {
        var rows = await uow.StyleDocuments.Query()
            .Where(x => x.CompanyId == query.CompanyId && x.StyleId == query.StyleId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<StyleDocumentDto>>(rows);
    }

    public async Task<IReadOnlyList<OrderDocumentDto>> Handle(GetOrderDocumentsQuery query, CancellationToken cancellationToken)
    {
        var rows = await uow.OrderDocuments.Query()
            .Where(x => x.CompanyId == query.CompanyId && x.OrderId == query.OrderId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<OrderDocumentDto>>(rows);
    }
}

public sealed class CommunicationCommandHandlers(IUnitOfWork uow, IMapper mapper) :
    IRequestHandler<CreateCommunicationLogCommand, CommunicationLogDto>
{
    public async Task<CommunicationLogDto> Handle(CreateCommunicationLogCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        if (!request.StyleId.HasValue && !request.OrderId.HasValue)
        {
            throw new InvalidOperationException("Either styleId or orderId is required.");
        }

        var log = new CommunicationLog
        {
            CompanyId = request.CompanyId,
            StyleId = request.StyleId,
            OrderId = request.OrderId,
            Direction = request.Direction,
            Subject = request.Subject.Trim(),
            Message = request.Message.Trim(),
            ContactName = request.ContactName,
            LoggedAt = BusinessTime.Now,
        };
        await uow.CommunicationLogs.AddAsync(log, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<CommunicationLogDto>(log);
    }
}

public sealed class CommunicationQueryHandlers(IUnitOfWork uow, IMapper mapper) :
    IRequestHandler<GetCommunicationLogsQuery, IReadOnlyList<CommunicationLogDto>>
{
    public async Task<IReadOnlyList<CommunicationLogDto>> Handle(GetCommunicationLogsQuery query, CancellationToken cancellationToken)
    {
        var rowsQuery = uow.CommunicationLogs.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.StyleId.HasValue)
        {
            rowsQuery = rowsQuery.Where(x => x.StyleId == query.StyleId.Value);
        }

        if (query.OrderId.HasValue)
        {
            rowsQuery = rowsQuery.Where(x => x.OrderId == query.OrderId.Value);
        }

        var rows = await rowsQuery.OrderByDescending(x => x.LoggedAt).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<CommunicationLogDto>>(rows);
    }
}

public sealed class ApprovalCommandHandlers(IUnitOfWork uow, IMerchandisingDbContext db, IMapper mapper) :
    IRequestHandler<CreateApprovalRequestCommand, ApprovalRequestDto>,
    IRequestHandler<ApproveStepCommand, ApprovalRequestDto>,
    IRequestHandler<RejectStepCommand, ApprovalRequestDto>
{
    public async Task<ApprovalRequestDto> Handle(CreateApprovalRequestCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        if (request.Steps.Count == 0 || request.Steps.Any(s => s.ApprovalLevel < 1)
            || request.Steps.Select(s => s.ApprovalLevel).Distinct().Count() != request.Steps.Count)
            throw new InvalidOperationException("Provide unique positive approval levels.");
        var approval = new ApprovalRequest
        {
            CompanyId = request.CompanyId,
            EntityType = request.EntityType.Trim(),
            EntityId = request.EntityId,
            RequestType = request.RequestType.Trim(),
            RequestedBy = request.RequestedBy.Trim(),
            RequestedAt = BusinessTime.Now,
            Status = ApprovalRequestStatuses.Pending,
        };

        foreach (var step in request.Steps.OrderBy(x => x.ApprovalLevel))
        {
            approval.Steps.Add(new ApprovalStep
            {
                CompanyId = request.CompanyId,
                ApprovalLevel = step.ApprovalLevel,
                ApproverUserId = step.ApproverUserId,
                Status = ApprovalStepStatuses.Pending,
            });
        }

        await uow.ApprovalRequests.AddAsync(approval, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return await MapApprovalAsync(approval.Id, cancellationToken);
    }

    public async Task<ApprovalRequestDto> Handle(ApproveStepCommand command, CancellationToken cancellationToken)
    {
        var approval = await uow.ApprovalRequests.GetByIdAsync(command.RequestId, cancellationToken) ?? throw new KeyNotFoundException("Approval request not found.");
        var step = await db.ApprovalSteps.FirstOrDefaultAsync(x => x.Id == command.StepId && x.ApprovalRequestId == approval.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Approval step not found.");
        if (approval.Status != ApprovalRequestStatuses.Pending || step.Status != ApprovalStepStatuses.Pending)
            throw new InvalidOperationException("Only pending requests and steps can be reviewed.");
        if (step.ApproverUserId.HasValue && step.ApproverUserId != command.Request.ApproverUserId)
            throw new UnauthorizedAccessException("You are not the assigned approver.");
        if (approval.RequestedBy == command.Request.ApproverUserId.ToString())
            throw new UnauthorizedAccessException("The requester cannot approve their own request.");
        if (await db.ApprovalSteps.AnyAsync(x => x.ApprovalRequestId == approval.Id && x.ApprovalLevel < step.ApprovalLevel && x.Status == ApprovalStepStatuses.Pending, cancellationToken))
            throw new InvalidOperationException("Earlier approval steps must be completed first.");


        step.Status = ApprovalStepStatuses.Approved;
        step.ApproverUserId = command.Request.ApproverUserId;
        step.Remarks = command.Request.Remarks;
        step.ActionAt = BusinessTime.Now;

        var hasPending = await db.ApprovalSteps.AnyAsync(
            x => x.ApprovalRequestId == approval.Id && x.Id != step.Id && x.Status == ApprovalStepStatuses.Pending,
            cancellationToken);
        if (!hasPending)
        {
            approval.Status = ApprovalRequestStatuses.Approved;
        }

        approval.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return await MapApprovalAsync(approval.Id, cancellationToken);
    }

    public async Task<ApprovalRequestDto> Handle(RejectStepCommand command, CancellationToken cancellationToken)
    {
        var approval = await uow.ApprovalRequests.GetByIdAsync(command.RequestId, cancellationToken) ?? throw new KeyNotFoundException("Approval request not found.");
        var step = await db.ApprovalSteps.FirstOrDefaultAsync(x => x.Id == command.StepId && x.ApprovalRequestId == approval.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Approval step not found.");
        if (approval.Status != ApprovalRequestStatuses.Pending || step.Status != ApprovalStepStatuses.Pending)
            throw new InvalidOperationException("Only pending requests and steps can be reviewed.");
        if (step.ApproverUserId.HasValue && step.ApproverUserId != command.Request.ApproverUserId)
            throw new UnauthorizedAccessException("You are not the assigned approver.");
        if (approval.RequestedBy == command.Request.ApproverUserId.ToString())
            throw new UnauthorizedAccessException("The requester cannot approve their own request.");
        if (await db.ApprovalSteps.AnyAsync(x => x.ApprovalRequestId == approval.Id && x.ApprovalLevel < step.ApprovalLevel && x.Status == ApprovalStepStatuses.Pending, cancellationToken))
            throw new InvalidOperationException("Earlier approval steps must be completed first.");


        step.Status = ApprovalStepStatuses.Rejected;
        step.ApproverUserId = command.Request.ApproverUserId;
        step.Remarks = command.Request.Remarks;
        step.ActionAt = BusinessTime.Now;
        approval.Status = ApprovalRequestStatuses.Rejected;
        approval.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return await MapApprovalAsync(approval.Id, cancellationToken);
    }

    private async Task<ApprovalRequestDto> MapApprovalAsync(Guid id, CancellationToken cancellationToken)
    {
        var approval = await db.ApprovalRequests
            .Include(x => x.Steps.OrderBy(s => s.ApprovalLevel))
            .FirstAsync(x => x.Id == id, cancellationToken);
        return mapper.Map<ApprovalRequestDto>(approval);
    }
}

public sealed class ApprovalQueryHandlers(IMerchandisingDbContext db, IMapper mapper) :
    IRequestHandler<GetApprovalRequestQuery, ApprovalRequestDto>,
    IRequestHandler<GetPendingApprovalsQuery, IReadOnlyList<ApprovalRequestDto>>
{
    public async Task<ApprovalRequestDto> Handle(GetApprovalRequestQuery query, CancellationToken cancellationToken)
    {
        var approval = await db.ApprovalRequests
            .Include(x => x.Steps.OrderBy(s => s.ApprovalLevel))
            .FirstOrDefaultAsync(x => x.CompanyId == query.CompanyId && x.Id == query.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Approval request not found.");
        return mapper.Map<ApprovalRequestDto>(approval);
    }

    public async Task<IReadOnlyList<ApprovalRequestDto>> Handle(GetPendingApprovalsQuery query, CancellationToken cancellationToken)
    {
        var rows = await db.ApprovalRequests
            .Include(x => x.Steps.OrderBy(s => s.ApprovalLevel))
            .Where(x => x.CompanyId == query.CompanyId && x.Status == ApprovalRequestStatuses.Pending)
            .OrderByDescending(x => x.RequestedAt)
            .ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<ApprovalRequestDto>>(rows);
    }
}

public sealed class ShipmentExecutionCommandHandlers(IUnitOfWork uow, IMerchandisingDbContext db, IMapper mapper) :
    IRequestHandler<CreateShipmentExecutionCommand, ShipmentExecutionDto>,
    IRequestHandler<CreatePackingListCommand, PackingListDto>
{
    public async Task<ShipmentExecutionDto> Handle(CreateShipmentExecutionCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var plan = await uow.ShipmentPlans.GetByIdAsync(request.ShipmentPlanId, cancellationToken) ?? throw new KeyNotFoundException("Shipment plan not found.");
        var exists = await uow.ShipmentExecutions.Query().AnyAsync(x => x.ShipmentPlanId == plan.Id, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Shipment execution already exists for this plan.");
        }

        var execution = new ShipmentExecution
        {
            CompanyId = request.CompanyId,
            ShipmentPlanId = plan.Id,
            ActualShipmentDate = request.ActualShipmentDate,
            ShippedQty = request.ShippedQty,
            Status = request.Status ?? ShipmentExecutionStatuses.Planned,
        };
        await uow.ShipmentExecutions.AddAsync(execution, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<ShipmentExecutionDto>(execution);
    }

    public async Task<PackingListDto> Handle(CreatePackingListCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var execution = await uow.ShipmentExecutions.GetByIdAsync(request.ShipmentExecutionId, cancellationToken)
            ?? throw new KeyNotFoundException("Shipment execution not found.");

        var packingList = new PackingList
        {
            CompanyId = request.CompanyId,
            ShipmentExecutionId = execution.Id,
            CartonCount = request.CartonCount,
            GrossWeightKg = request.GrossWeightKg,
            NetWeightKg = request.NetWeightKg,
            Remarks = request.Remarks,
        };

        if (request.Cartons is not null)
        {
            foreach (var carton in request.Cartons)
            {
                packingList.CartonBreakdowns.Add(new CartonBreakdown
                {
                    CompanyId = request.CompanyId,
                    CartonNo = carton.CartonNo,
                    ColorName = carton.ColorName.Trim(),
                    SizeName = carton.SizeName.Trim(),
                    Quantity = carton.Quantity,
                });
            }
        }

        db.Add(packingList);
        await uow.SaveChangesAsync(cancellationToken);

        var loaded = await db.PackingLists
            .Include(x => x.CartonBreakdowns)
            .FirstAsync(x => x.Id == packingList.Id, cancellationToken);
        return mapper.Map<PackingListDto>(loaded);
    }
}

public sealed class ShipmentExecutionQueryHandlers(IUnitOfWork uow, IMapper mapper) :
    IRequestHandler<GetShipmentExecutionQuery, ShipmentExecutionDto?>
{
    public async Task<ShipmentExecutionDto?> Handle(GetShipmentExecutionQuery query, CancellationToken cancellationToken)
    {
        var execution = await uow.ShipmentExecutions.Query()
            .FirstOrDefaultAsync(x => x.CompanyId == query.CompanyId && x.ShipmentPlanId == query.ShipmentPlanId, cancellationToken);
        return execution is null ? null : mapper.Map<ShipmentExecutionDto>(execution);
    }
}

public sealed class Phase1213ReportQueryHandlers(IMerchandisingDbContext db) :
    IRequestHandler<GetTnaDelayReportQuery, IReadOnlyList<TnaDelayReportRowDto>>,
    IRequestHandler<GetBookingStatusReportQuery, IReadOnlyList<BookingStatusReportRowDto>>,
    IRequestHandler<GetOrderPipelineReportQuery, IReadOnlyList<OrderPipelineReportRowDto>>
{
    public async Task<IReadOnlyList<TnaDelayReportRowDto>> Handle(GetTnaDelayReportQuery query, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(BusinessTime.Now);
        var rows = await (
            from calendar in db.TnaCalendars.Where(x => x.CompanyId == query.CompanyId)
            join order in db.Orders on calendar.OrderId equals order.Id
            from milestone in db.TnaMilestones.Where(x => x.TnaCalendarId == calendar.Id)
            where milestone.Status != TnaMilestoneStatuses.Completed
                  && milestone.PlannedDate < today
            select new TnaDelayReportRowDto(
                order.Id,
                order.OrderNo,
                milestone.Id,
                milestone.MilestoneName,
                milestone.PlannedDate,
                milestone.ActualDate,
                today.DayNumber - milestone.PlannedDate.DayNumber,
                milestone.Status))
            .ToListAsync(cancellationToken);
        return rows;
    }

    public async Task<IReadOnlyList<BookingStatusReportRowDto>> Handle(GetBookingStatusReportQuery query, CancellationToken cancellationToken)
    {
        var bookingsQuery = db.MaterialBookings.Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue)
        {
            bookingsQuery = bookingsQuery.Where(x => x.OrderId == query.OrderId.Value);
        }

        var rows = await (
            from booking in bookingsQuery
            join order in db.Orders on booking.OrderId equals order.Id
            let fabricBooked = db.FabricBookingDetails.Where(x => x.MaterialBookingId == booking.Id).Sum(x => x.BookedQty)
            let trimsBooked = db.TrimsBookingDetails.Where(x => x.MaterialBookingId == booking.Id).Sum(x => x.BookedQty)
            select new BookingStatusReportRowDto(
                order.Id,
                order.OrderNo,
                booking.Id,
                booking.BookingNo,
                booking.BookingType,
                booking.Status,
                booking.TotalQty,
                fabricBooked + trimsBooked))
            .ToListAsync(cancellationToken);
        return rows;
    }

    public async Task<IReadOnlyList<OrderPipelineReportRowDto>> Handle(GetOrderPipelineReportQuery query, CancellationToken cancellationToken)
    {
        var rows = await db.Orders
            .Where(x => x.CompanyId == query.CompanyId)
            .GroupBy(x => x.OrderStatus)
            .Select(g => new
            {
                OrderStatus = g.Key,
                OrderCount = g.Count(),
                TotalQuantity = g.Sum(x => x.TotalOrderQty),
                TotalValue = g.Sum(x => x.TotalValue),
            })
            .OrderBy(x => x.OrderStatus)
            .ToListAsync(cancellationToken);

        return rows
            .Select(x => new OrderPipelineReportRowDto(x.OrderStatus, x.OrderCount, x.TotalQuantity, x.TotalValue))
            .ToList();
    }
}
