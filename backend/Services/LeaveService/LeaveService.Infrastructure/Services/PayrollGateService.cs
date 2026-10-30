using LeaveService.Application.Common.Exceptions;
using LeaveService.Application.Common.Interfaces;

namespace LeaveService.Infrastructure.Services;

public sealed class PayrollGateService(ILeaveUnitOfWork uow, IPayrollServiceClient payroll) : IPayrollGate
{
    public async Task EnsureUnlockedForPeriodAsync(Guid companyId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        var cursor = new DateOnly(from.Year, from.Month, 1);
        var end = new DateOnly(to.Year, to.Month, 1);
        while (cursor <= end)
        {
            var row = await uow.PayrollMonthLocks.GetAsync(companyId, cursor.Year, cursor.Month, cancellationToken);
            if (row?.IsLocked == true)
            {
                throw new LeaveBusinessException($"Payroll is locked for {cursor.Year}-{cursor.Month:00}.");
            }

            if (await payroll.IsPayrollLockedAsync(companyId, cursor.Year, cursor.Month, cancellationToken))
            {
                throw new LeaveBusinessException($"Payroll is locked for {cursor.Year}-{cursor.Month:00}.");
            }

            cursor = cursor.AddMonths(1);
        }
    }
}
