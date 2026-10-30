using MerchandisingService.Application.Common;
using MerchandisingService.Domain;

namespace MerchandisingService.Tests;

public sealed class CalculationTests
{
    [Fact]
    public void Bom_calculation_includes_wastage_and_total_cost()
    {
        var service = new BomCalculationService();
        var item = new BomItem
        {
            Consumption = 1.5m,
            WastagePercent = 5m,
            UnitPrice = 2m,
        };

        service.Calculate(item, 100);

        Assert.Equal(157.5m, item.RequiredQty);
        Assert.Equal(315m, item.TotalCost);
    }

    [Fact]
    public void Costing_calculation_sets_profit_values()
    {
        var service = new CostingCalculationService();
        var costing = new OrderCosting
        {
            FabricCost = 100,
            AccessoriesCost = 20,
            CM = 30,
            WashingCost = 10,
            SellingPrice = 200,
        };

        service.Calculate(costing);

        Assert.Equal(160, costing.TotalCost);
        Assert.Equal(40, costing.ProfitAmount);
        Assert.Equal(20, costing.ProfitPercent);
    }
}
