using System.Net.Http.Json;
using HRService.Application.Employees;

namespace HRService.Infrastructure.Services;

public sealed class HrNotificationClient(HttpClient httpClient) : IHrNotificationClient
{
    public async Task SendEmployeeOnboardedAsync(Guid employeeId, string fullName, CancellationToken cancellationToken = default)
    {
        try
        {
            await httpClient.PostAsJsonAsync("/api/v1/notification/send", new
            {
                recipientId = employeeId,
                type = "InApp",
                subject = "Welcome to the Team!",
                body = $"Welcome {fullName}! Your HR account has been set up. Please complete your profile."
            }, cancellationToken);
        }
        catch { /* notification failure must not block onboarding */ }
    }

    public async Task SendEmployeeTransferredAsync(Guid employeeId, string fullName, string? toDepartment, CancellationToken cancellationToken = default)
    {
        try
        {
            await httpClient.PostAsJsonAsync("/api/v1/notification/send", new
            {
                recipientId = employeeId,
                type = "InApp",
                subject = "Department Transfer",
                body = $"Dear {fullName}, you have been transferred to {toDepartment ?? "a new department"}."
            }, cancellationToken);
        }
        catch { /* notification failure must not block transfer */ }
    }
}
