using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using SecurityService.Domain;
using SecurityService.Infrastructure.Persistence;

namespace SecurityService.Infrastructure.EventBus;

public sealed class RabbitMqConsumerHostedService(
    IConfiguration configuration,
    IServiceScopeFactory scopeFactory,
    ILogger<RabbitMqConsumerHostedService> logger) : BackgroundService
{
    private static readonly string[] ConsumedEvents =
    [
        "SupplierCreated",
        "BuyerCreated",
        "EmployeeCreated",
        "PurchaseOrderApproved",
        "StockIssueConfirmed",
        "ShipmentPlanCreated"
    ];

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (configuration.GetValue("RabbitMQ:DisableConsumers", false))
        {
            logger.LogInformation("SecurityService RabbitMQ consumers are disabled.");
            return Task.CompletedTask;
        }

        _ = Task.Run(() => Consume(stoppingToken), stoppingToken);
        return Task.CompletedTask;
    }

    private void Consume(CancellationToken stoppingToken)
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
            var queue = configuration["RabbitMQ:SecurityQueue"] ?? "security-service";
            channel.ExchangeDeclare(exchange, ExchangeType.Topic, durable: true, autoDelete: false);
            channel.QueueDeclare(queue, durable: true, exclusive: false, autoDelete: false);
            foreach (var eventName in ConsumedEvents)
            {
                channel.QueueBind(queue, exchange, eventName);
            }

            var consumer = new AsyncEventingBasicConsumer(channel);
            consumer.Received += async (_, args) =>
            {
                await StoreSnapshotAsync(args.RoutingKey, Encoding.UTF8.GetString(args.Body.ToArray()), stoppingToken);
                channel.BasicAck(args.DeliveryTag, multiple: false);
            };
            channel.BasicConsume(queue, autoAck: false, consumer);

            while (!stoppingToken.IsCancellationRequested)
            {
                Thread.Sleep(TimeSpan.FromSeconds(2));
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SecurityService RabbitMQ consumer stopped. The API can continue without the consumer.");
        }
    }

    private async Task StoreSnapshotAsync(string eventName, string payload, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SecurityDbContext>();
        var document = JsonDocument.Parse(payload);
        var root = document.RootElement;
        var companyId = TryReadGuid(root, "companyId") ?? Guid.Empty;
        var referenceId = TryReadGuid(root, "id") ?? TryReadGuid(root, "entityId") ?? Guid.NewGuid();

        db.ExternalReferenceSnapshots.Add(new ExternalReferenceSnapshot
        {
            CompanyId = companyId,
            ReferenceType = eventName.Replace("Created", string.Empty).Replace("Approved", string.Empty).Replace("Confirmed", string.Empty),
            ReferenceId = referenceId,
            EventName = eventName,
            PayloadJson = payload,
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    private static Guid? TryReadGuid(JsonElement element, string property)
    {
        if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty(property, out var value) && Guid.TryParse(value.GetString(), out var id))
        {
            return id;
        }

        return null;
    }
}
