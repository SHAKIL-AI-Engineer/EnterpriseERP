using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CuttingService.Infrastructure.EventBus;

public sealed class RabbitMqConsumerHostedService(ILogger<RabbitMqConsumerHostedService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("CuttingService RabbitMQ consumers registered for OrderConfirmed, StockIssued, FabricIssuedToCutting, and ProductionPanelReceived.");
        return Task.CompletedTask;
    }
}
