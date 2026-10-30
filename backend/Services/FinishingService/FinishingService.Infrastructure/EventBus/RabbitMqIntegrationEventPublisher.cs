using System.Text.Json;
using FinishingService.Application;
using FinishingService.Contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FinishingService.Infrastructure.EventBus;

public sealed class RabbitMqIntegrationEventPublisher(IConfiguration configuration, ILogger<RabbitMqIntegrationEventPublisher> logger) : IIntegrationEventPublisher
{
    public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent
    {
        var exchange = configuration["RabbitMQ:Exchange"] ?? "erp.finishing";
        logger.LogInformation("Publishing integration event {EventName} to exchange {Exchange}: {Payload}", 
            integrationEvent.EventName, exchange, JsonSerializer.Serialize(integrationEvent));
        return Task.CompletedTask;
    }
}
