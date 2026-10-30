using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record GetOrderSummaryReportQuery(Guid CompanyId, Guid? BuyerId, string? Status) : IRequest<IReadOnlyList<OrderDto>>;
