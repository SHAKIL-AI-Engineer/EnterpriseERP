using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AccountsService.Infrastructure.EventBus;

public sealed class RabbitMqConsumerHostedService(ILogger<RabbitMqConsumerHostedService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AccountsService RabbitMQ consumers registered for StockReceived, PayrollApproved, SalaryAdvanceApproved, PurchaseInvoiceApproved, and ShipmentInvoiceCreated.");
        return Task.CompletedTask;
    }
}
