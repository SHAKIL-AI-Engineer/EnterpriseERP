using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FinishingService.Infrastructure.EventBus;

public sealed class RabbitMqConsumerHostedService(ILogger<RabbitMqConsumerHostedService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("FinishingService RabbitMQ consumers registered for SewingOutputCreated, ProductionOutputCreated, CuttingPanelTransferred, ShipmentPlanCreated, and FinishedGoodsShipped.");
        return Task.CompletedTask;
    }
}
