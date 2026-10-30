using PayrollService.Contracts;
using PayrollService.Domain.Entities;

namespace PayrollService.Application;

public static class Mappers
{
    public static SalaryStructureDto ToDto(this SalaryStructure x, IReadOnlyList<SalaryStructureComponent>? components = null) => new(
        x.Id, x.CompanyId, x.StructureCode, x.StructureName, x.GradeId, x.IsActive,
        (components ?? x.Components.ToList()).Select(c => c.ToDto()).ToList());

    public static SalaryStructureComponentDto ToDto(this SalaryStructureComponent x) => new(
        x.Id, x.CompanyId, x.SalaryStructureId, x.ComponentCode, x.ComponentName, x.ComponentType, x.CalculationType,
        x.Amount, x.Percentage, x.BasedOnComponentCode, x.IsTaxable, x.IsActive);

    public static EmployeeSalaryDto ToDto(this EmployeeSalary x) => new(
        x.Id, x.CompanyId, x.EmployeeId, x.SalaryStructureId, x.SalaryCalculationType, x.GrossSalary, x.BasicSalary,
        x.HouseRent, x.MedicalAllowance, x.ConveyanceAllowance, x.FoodAllowance, x.EffectiveFrom, x.EffectiveTo,
        x.IsCurrent);

    public static SalaryIncrementDto ToDto(this SalaryIncrementRequestEntity x) => new(
        x.Id, x.CompanyId, x.EmployeeId, x.OldGrossSalary, x.NewGrossSalary, x.IncrementAmount, x.IncrementPercentage,
        x.EffectiveFrom, x.Status);

    public static EmployeePayrollDto ToDto(
        this EmployeePayroll x,
        IReadOnlyList<PayrollEarning>? earnings = null,
        IReadOnlyList<PayrollDeduction>? deductions = null) => new(
        x.Id, x.CompanyId, x.YearNo, x.MonthNo, x.PayrollRunId, x.EmployeeId, x.ProcessingMode, x.SalaryCalculationType,
        x.OvertimeCalculationType, x.GrossSalary, x.BasicSalary, x.TotalDays, x.WorkingDays, x.PresentDays, x.AbsentDays,
        x.LeaveDays, x.LeaveWithoutPayDays, x.LateDays, x.OvertimeHours, x.OvertimeRate, x.OvertimeAmount,
        x.TiffinBillAmount, x.NightBillAmount, x.AttendanceBonusAmount, x.FestivalBonusAmount, x.EarnLeaveEncashmentAmount,
        x.TotalEarnings, x.TotalDeduction, x.NetSalary, x.Status,
        (earnings ?? x.Earnings.ToList()).Select(e => new PayrollEarningDto(e.EarningCode, e.EarningName, e.Amount, e.IsManual, e.Remarks)).ToList(),
        (deductions ?? x.Deductions.ToList()).Select(d => new PayrollDeductionDto(d.DeductionCode, d.DeductionName, d.Amount, d.IsManual, d.Remarks)).ToList());

    public static SalaryAdvanceDto ToDto(this SalaryAdvance x) => new(
        x.Id, x.CompanyId, x.EmployeeId, x.AdvanceNo, x.AdvanceAmount, x.PaidAmount, x.BalanceAmount, x.AdvanceDate,
        x.InstallmentAmount, x.Status);

    public static AllowanceBillDto ToDto(this AllowanceBill x) => new(
        x.Id, x.CompanyId, x.EmployeeId, x.AllowanceType, x.BillDate, x.Quantity, x.Rate, x.Amount, x.Status, x.Remarks);

    public static DeductionDto ToDto(this PayrollDeductionEntry x) => new(
        x.Id, x.CompanyId, x.EmployeeId, x.DeductionType, x.Amount, x.YearNo, x.MonthNo, x.Status, x.Remarks);

    public static FinalSettlementDto ToDto(this FinalSettlement x) => new(
        x.Id, x.CompanyId, x.EmployeeId, x.SettlementDate, x.LastWorkingDate, x.NetPayable, x.Status);
}
