using System.Text;
using System.Text.Json;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;

namespace MerchandisingService.Infrastructure.EventBus;

public sealed class RabbitMqIntegrationEventPublisher(IConfiguration configuration, ILogger<RabbitMqIntegrationEventPublisher> logger) : IIntegrationEventPublisher
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent
    {
        try
        {
            var factory = new ConnectionFactory
            {
                HostName = configuration["RabbitMQ:HostName"] ?? configuration["RabbitMQ:Host"] ?? "localhost",
                UserName = configuration["RabbitMQ:UserName"] ?? "guest",
                Password = configuration["RabbitMQ:Password"] ?? "guest",
                DispatchConsumersAsync = true,
            };
            using var connection = factory.CreateConnection();
            using var channel = connection.CreateModel();
            var exchange = configuration["RabbitMQ:Exchange"] ?? "erp.events";
            channel.ExchangeDeclare(exchange, ExchangeType.Topic, durable: true, autoDelete: false);
            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(integrationEvent, JsonOptions));
            var properties = channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";
            properties.Type = integrationEvent.EventName;
            channel.BasicPublish(exchange, routingKey: integrationEvent.EventName, basicProperties: properties, body: body);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "RabbitMQ publish failed for event {EventName}.", integrationEvent.EventName);
        }

        return Task.CompletedTask;
    }
}
