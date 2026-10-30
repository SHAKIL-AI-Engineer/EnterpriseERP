using Microsoft.Extensions.Configuration;
using QualityService.Application;
using QualityService.Contracts;
using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace QualityService.Infrastructure.EventBus;

public sealed class RabbitMqIntegrationEventPublisher : IIntegrationEventPublisher
{
    private readonly IConnection? _connection;
    private readonly IModel? _channel;

    public RabbitMqIntegrationEventPublisher(IConfiguration config)
    {
        try
        {
            var host = config["ConnectionStrings:RabbitMQ"] ?? "localhost";
            var factory = new ConnectionFactory { HostName = host, Port = 5672 };
            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
            _channel.ExchangeDeclare("quality-exchange", ExchangeType.Fanout, durable: true);
        }
        catch
        {
            // Resilient Fallback if RabbitMQ offline
        }
    }

    public async Task PublishAsync<T>(T @event, CancellationToken ct = default) where T : IntegrationEvent
    {
        if (_channel is null) return;

        try
        {
            var body = JsonSerializer.Serialize(@event);
            var bytes = Encoding.UTF8.GetBytes(body);

            _channel.BasicPublish(
                exchange: "quality-exchange",
                routingKey: string.Empty,
                basicProperties: null,
                body: bytes);
        }
        catch
        {
            // Resilient Fallback
        }

        await Task.CompletedTask;
    }
}
