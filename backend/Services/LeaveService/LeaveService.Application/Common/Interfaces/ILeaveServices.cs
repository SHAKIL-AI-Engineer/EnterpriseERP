namespace LeaveService.Application.Common.Interfaces;

public interface ILeaveDayCalculator
{
    Task<decimal> CalculateLeaveDaysAsync(
        Guid companyId,
        Guid leaveTypeId,
        DateOnly from,
        DateOnly to,
        bool isHalfDay,
        CancellationToken cancellationToken = default);
}

public interface ILeaveBalanceService
{
    Task ApplyPendingAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default);
    Task FinalizeApprovalAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default);
    Task ReleasePendingAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default);
    Task RestoreApprovedAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default);

    /// <summary>Used when policy does not require approval (no pending reservation).</summary>
    Task RecordDirectApprovalAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default);
}

public interface IIntegrationMessagePublisher
{
    Task PublishJsonAsync(string routingKey, object payload, CancellationToken cancellationToken = default);
}

public interface ILeaveAuditService
{
    Task WriteAsync(Guid? companyId, Guid? userId, string action, string entityType, Guid? entityId, string? details, CancellationToken cancellationToken = default);
}

public interface IPayrollGate
{
    Task EnsureUnlockedForPeriodAsync(Guid companyId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
}
