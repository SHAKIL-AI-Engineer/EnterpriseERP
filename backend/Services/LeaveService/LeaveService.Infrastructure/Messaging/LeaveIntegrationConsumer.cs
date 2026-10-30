using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace LeaveService.Infrastructure.Messaging;
public sealed class LeaveIntegrationConsumer(ILogger<LeaveIntegrationConsumer> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("LeaveService integration consumer stub is running. Configure RabbitMq and implement handlers for production.");
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }
}
