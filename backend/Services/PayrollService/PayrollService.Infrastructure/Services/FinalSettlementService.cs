using PayrollService.Application;
using PayrollService.Domain.Entities;

namespace PayrollService.Infrastructure.Services;

public sealed class FinalSettlementService : IFinalSettlementService
{
    public decimal CalculateNetPayable(FinalSettlement settlement) =>
        settlement.SalaryPayable + settlement.EarnLeaveAmount + settlement.ServiceBenefitAmount + settlement.GratuityAmount
        - settlement.AdvanceDeduction - settlement.OtherDeduction;
}
