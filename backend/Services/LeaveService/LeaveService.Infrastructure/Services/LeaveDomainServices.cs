using LeaveService.Application.Common.Interfaces;
using LeaveService.Domain.Entities;

using Erp.BuildingBlocks.SharedKernel;

namespace LeaveService.Infrastructure.Services;

public sealed class LeaveDayCalculatorService(ILeaveUnitOfWork uow) : ILeaveDayCalculator
{
    public async Task<decimal> CalculateLeaveDaysAsync(
        Guid companyId,
        Guid leaveTypeId,
        DateOnly from,
        DateOnly to,
        bool isHalfDay,
        CancellationToken cancellationToken = default)
    {
        if (isHalfDay && from != to)
        {
            throw new InvalidOperationException("Half-day leave must be on a single calendar date.");
        }

        var policy = await uow.LeavePolicies.GetActiveByCompanyAndLeaveTypeAsync(companyId, leaveTypeId, cancellationToken);
        var excludeHolidays = policy?.ExcludeHolidaysFromLeaveDays ?? true;
        var excludeWeeklyOff = policy?.ExcludeWeeklyOffFromLeaveDays ?? true;

        var holidays = excludeHolidays
            ? await uow.Holidays.ListActiveBetweenAsync(companyId, from, to, cancellationToken)
            : Array.Empty<Holiday>();

        var holidayDates = new HashSet<DateOnly>(holidays.Select(h => h.HolidayDate));

        var weeklyOffNames = excludeWeeklyOff
            ? (await uow.WeeklyOffRules.ListByCompanyAsync(companyId, cancellationToken)).Select(x => x.DayOfWeekName).ToHashSet(StringComparer.OrdinalIgnoreCase)
            : new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        decimal count = 0;
        for (var d = from; d <= to; d = d.AddDays(1))
        {
            if (excludeHolidays && holidayDates.Contains(d))
            {
                continue;
            }

            if (excludeWeeklyOff)
            {
                var dow = d.ToDateTime(TimeOnly.MinValue).DayOfWeek.ToString();
                if (weeklyOffNames.Contains(dow))
                {
                    continue;
                }
            }

            count += 1;
        }

        if (isHalfDay)
        {
            return Math.Min(0.5m, count > 0 ? 0.5m : 0);
        }

        return count;
    }
}

public sealed class LeaveBalanceService(ILeaveUnitOfWork uow) : ILeaveBalanceService
{
    public async Task ApplyPendingAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default)
    {
        var b = await uow.EmployeeLeaveBalances.GetAsync(companyId, employeeId, leaveTypeId, yearNo, cancellationToken)
                ?? throw new InvalidOperationException("Employee leave balance row not found.");
        b.PendingDays += days;
        b.UpdatedAt = BusinessTime.Now;
    }

    public async Task FinalizeApprovalAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default)
    {
        var b = await uow.EmployeeLeaveBalances.GetAsync(companyId, employeeId, leaveTypeId, yearNo, cancellationToken)
                ?? throw new InvalidOperationException("Employee leave balance row not found.");
        b.PendingDays -= days;
        b.UsedDays += days;
        b.BalanceDays -= days;
        b.UpdatedAt = BusinessTime.Now;
    }

    public async Task ReleasePendingAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default)
    {
        var b = await uow.EmployeeLeaveBalances.GetAsync(companyId, employeeId, leaveTypeId, yearNo, cancellationToken)
                ?? throw new InvalidOperationException("Employee leave balance row not found.");
        b.PendingDays -= days;
        b.UpdatedAt = BusinessTime.Now;
    }

    public async Task RestoreApprovedAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default)
    {
        var b = await uow.EmployeeLeaveBalances.GetAsync(companyId, employeeId, leaveTypeId, yearNo, cancellationToken)
                ?? throw new InvalidOperationException("Employee leave balance row not found.");
        b.UsedDays -= days;
        b.BalanceDays += days;
        b.UpdatedAt = BusinessTime.Now;
    }

    public async Task RecordDirectApprovalAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, decimal days, CancellationToken cancellationToken = default)
    {
        var b = await uow.EmployeeLeaveBalances.GetAsync(companyId, employeeId, leaveTypeId, yearNo, cancellationToken)
                ?? throw new InvalidOperationException("Employee leave balance row not found.");
        b.UsedDays += days;
        b.BalanceDays -= days;
        b.UpdatedAt = BusinessTime.Now;
    }
}

public sealed class LeaveAuditService(ILeaveUnitOfWork uow) : ILeaveAuditService
{
    public Task WriteAsync(Guid? companyId, Guid? userId, string action, string entityType, Guid? entityId, string? details, CancellationToken cancellationToken = default)
    {
        uow.AuditLogs.Add(new LeaveAuditLog
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            CreatedAt = BusinessTime.Now,
        });
        return Task.CompletedTask;
    }
}
