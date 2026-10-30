using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace PayrollService.Infrastructure.EventBus;

public sealed class RabbitMqConsumerHostedService(ILogger<RabbitMqConsumerHostedService> logger) : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("PayrollService RabbitMQ consumers registered for MonthlyAttendanceSummaryGenerated, LeaveEncashmentApproved, EmployeeResigned, SalaryIncrementApproved, and AllowanceBillApproved.");
        return Task.CompletedTask;
    }
}
