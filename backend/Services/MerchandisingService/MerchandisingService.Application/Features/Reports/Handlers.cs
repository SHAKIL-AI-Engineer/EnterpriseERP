using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed class OrderSummaryReportQueryHandler(IMediator mediator) : IRequestHandler<GetOrderSummaryReportQuery, IReadOnlyList<OrderDto>>
{
    public Task<IReadOnlyList<OrderDto>> Handle(GetOrderSummaryReportQuery query, CancellationToken cancellationToken) =>
        mediator.Send(new GetOrdersQuery(query.CompanyId, query.BuyerId, query.Status), cancellationToken);
}
