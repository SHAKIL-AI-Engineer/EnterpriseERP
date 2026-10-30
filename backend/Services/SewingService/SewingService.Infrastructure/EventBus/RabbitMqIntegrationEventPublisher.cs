using System.Text.Json;
using SewingService.Application;
using SewingService.Contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SewingService.Infrastructure.EventBus;

public sealed class RabbitMqIntegrationEventPublisher(IConfiguration configuration, ILogger<RabbitMqIntegrationEventPublisher> logger) : IIntegrationEventPublisher
{
    public Task PublishAsync<T>(T integrationEvent, CancellationToken cancellationToken = default) where T : class
    {
        var exchange = configuration["RabbitMQ:Exchange"] ?? "erp.sewing";
        var eventName = integrationEvent.GetType().Name;
        logger.LogInformation("Publishing integration event {EventName} to exchange {Exchange}: {Payload}", eventName, exchange, JsonSerializer.Serialize(integrationEvent));
        return Task.CompletedTask;
    }
}
