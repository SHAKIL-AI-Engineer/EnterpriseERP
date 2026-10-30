using System.Text;
using System.Text.Json;
using LeaveService.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Exceptions;

namespace LeaveService.Infrastructure.Messaging;

public sealed class RabbitMqPublisherOptions
{
    public string HostName { get; set; } = "localhost";

    public string UserName { get; set; } = "erp";

    public string Password { get; set; } = "erp_dev_password";

    public string ExchangeName { get; set; } = "erp.events";
}

public sealed class RabbitMqJsonPublisher(
    IOptions<RabbitMqPublisherOptions> options,
    ILogger<RabbitMqJsonPublisher> logger) : IIntegrationMessagePublisher, IDisposable
{
    private readonly RabbitMqPublisherOptions _opt = options.Value;
    private IConnection? _connection;
    private readonly object _lock = new();

    public Task PublishJsonAsync(string routingKey, object payload, CancellationToken cancellationToken = default)
    {
        try
        {
            lock (_lock)
            {
                _connection ??= new ConnectionFactory
                {
                    HostName = _opt.HostName,
                    UserName = _opt.UserName,
                    Password = _opt.Password,
                }.CreateConnection();

                using var ch = _connection.CreateModel();
                ch.ExchangeDeclare(_opt.ExchangeName, ExchangeType.Topic, durable: true);
                var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));
                ch.BasicPublish(_opt.ExchangeName, routingKey, body: body);
            }
        }
        catch (BrokerUnreachableException ex)
        {
            logger.LogWarning(ex, "RabbitMQ unavailable; skipped publishing {RoutingKey}.", routingKey);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish {RoutingKey}; leave operation completed without event.", routingKey);
        }

        return Task.CompletedTask;
    }

    public void Dispose() => _connection?.Dispose();
}
