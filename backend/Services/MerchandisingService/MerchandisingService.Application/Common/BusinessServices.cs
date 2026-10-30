using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application.Common;

public sealed class BomCalculationService : IBomCalculationService
{
    public BomItem Calculate(BomItem item, int orderQuantity)
    {
        var baseRequired = orderQuantity * item.Consumption;
        item.RequiredQty = Math.Round(baseRequired + (baseRequired * item.WastagePercent / 100m), 4);
        item.TotalCost = Math.Round(item.RequiredQty * item.UnitPrice, 4);
        return item;
    }

    public BomCalculationResultDto Summarize(Guid orderId, IReadOnlyCollection<BomItem> items) =>
        new(orderId, items.Count, items.Sum(x => x.RequiredQty), items.Sum(x => x.TotalCost));
}

public sealed class CostingCalculationService : ICostingCalculationService
{
    public OrderCosting Calculate(OrderCosting costing)
    {
        costing.TotalCost = Math.Round(
            costing.FabricCost + costing.AccessoriesCost + costing.CM + costing.WashingCost +
            costing.EmbroideryCost + costing.PrintingCost + costing.OtherCost +
            costing.FreightCost + costing.CommercialCost + costing.BankCharges + costing.Commission, 4);
        costing.FinalFob = Math.Round(costing.TotalCost, 4);
        costing.ProfitAmount = Math.Round(costing.SellingPrice - costing.TotalCost, 4);
        costing.ProfitPercent = costing.SellingPrice <= 0 ? 0 : Math.Round(costing.ProfitAmount / costing.SellingPrice * 100m, 2);
        return costing;
    }
}

public sealed class TnaGenerationService : ITnaGenerationService
{
    public TnaCalendar GenerateFromTemplate(Order order, TnaTemplate template, DateOnly startDate)
    {
        var calendar = new TnaCalendar
        {
            CompanyId = order.CompanyId,
            OrderId = order.Id,
            TemplateId = template.Id,
            StartDate = startDate,
            Status = TnaCalendarStatuses.Active,
        };

        var templateMilestones = template.Milestones.OrderBy(x => x.SequenceNo).ToList();
        DateOnly cursor = startDate;
        foreach (var milestone in templateMilestones)
        {
            cursor = cursor.AddDays(7);
            calendar.Milestones.Add(new TnaMilestone
            {
                CompanyId = order.CompanyId,
                TnaCalendarId = calendar.Id,
                MilestoneName = milestone.MilestoneName,
                SequenceNo = milestone.SequenceNo,
                PlannedDate = cursor,
                Status = TnaMilestoneStatuses.Pending,
            });
        }

        calendar.EndDate = calendar.Milestones.Count > 0 ? calendar.Milestones.Max(x => x.PlannedDate) : startDate;
        return calendar;
    }
}
