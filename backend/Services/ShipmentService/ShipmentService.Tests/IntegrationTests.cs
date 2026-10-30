using ShipmentService.Domain;

namespace ShipmentService.Tests;

public sealed class IntegrationTests
{
    [Fact]
    public void ShipmentReadiness_has_default_ready_status()
    {
        var readiness = new ShipmentReadiness
        {
            CompanyId = Guid.NewGuid(),
            OrderId = Guid.NewGuid(),
            ReadyQty = 100,
            ReadyDate = DateOnly.FromDateTime(DateTime.Today)
        };

        Assert.Equal(ShipmentExecutionStatuses.Ready, readiness.Status);
    }

    [Fact]
    public void ShipmentExecution_has_default_planned_status()
    {
        var execution = new ShipmentExecution
        {
            CompanyId = Guid.NewGuid(),
            OrderId = Guid.NewGuid(),
            ShippedQty = 50
        };

        Assert.Equal(ShipmentExecutionStatuses.Planned, execution.Status);
    }
}
