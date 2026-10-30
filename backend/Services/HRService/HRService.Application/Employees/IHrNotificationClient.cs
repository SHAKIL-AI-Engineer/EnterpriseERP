namespace HRService.Application.Employees;

public interface IHrNotificationClient
{
    Task SendEmployeeOnboardedAsync(Guid employeeId, string fullName, CancellationToken cancellationToken = default);
    Task SendEmployeeTransferredAsync(Guid employeeId, string fullName, string? toDepartment, CancellationToken cancellationToken = default);
}
