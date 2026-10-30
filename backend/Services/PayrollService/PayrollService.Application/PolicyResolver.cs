using System.Text.Json;
using PayrollService.Domain.Entities;

namespace PayrollService.Application;

public sealed record ResolvedPayrollPolicy(
    PayrollPolicyTemplate Template,
    CompanyPayrollPolicyAssignment Assignment,
    PayrollCalculationSettings Settings,
    string ProcessingModeLabel);

public sealed class PolicyResolver(IPayrollDbContext db) : IPolicyResolver
{
    public Task<ResolvedPayrollPolicy?> TryResolveAsync(
        Guid companyId,
        DateOnly processDate,
        CancellationToken cancellationToken = default)
    {
        var assignment = db.CompanyPayrollPolicyAssignments
            .Where(x => x.CompanyId == companyId && x.IsActive && x.EffectiveFrom <= processDate)
            .OrderByDescending(x => x.EffectiveFrom)
            .ThenByDescending(x => x.AssignedAt)
            .FirstOrDefault();

        if (assignment is null)
        {
            return Task.FromResult<ResolvedPayrollPolicy?>(null);
        }

        var template = db.PayrollPolicyTemplates
            .FirstOrDefault(x => x.Id == assignment.PolicyTemplateId && x.Status == "Active");

        return Task.FromResult(template is null ? null : Map(template, assignment));
    }

    public async Task<ResolvedPayrollPolicy> ResolveRequiredAsync(
        Guid companyId,
        DateOnly processDate,
        CancellationToken cancellationToken = default)
    {
        var resolved = await TryResolveAsync(companyId, processDate, cancellationToken);
        if (resolved is null)
        {
            throw new InvalidOperationException("Salary policy not assigned. Contact Super Admin.");
        }

        return resolved;
    }

    public static ResolvedPayrollPolicy Map(PayrollPolicyTemplate template, CompanyPayrollPolicyAssignment assignment) =>
        new(template, assignment, ToSettings(template, assignment), template.ComplianceMode);

    public static PayrollCalculationSettings ToSettings(
        PayrollPolicyTemplate template,
        CompanyPayrollPolicyAssignment assignment)
    {
        var otType = template.OtBase.ToUpperInvariant() switch
        {
            "GROSS" => "GrossSalaryBased",
            "FIXED" => "FixedRate",
            _ => "BasicSalaryBased",
        };

        return new PayrollCalculationSettings(
            UseApprovedAttendanceOnly: template.RequireAttendanceApproval,
            AllowAbsentDeduction: template.AllowAbsentDeduction,
            AllowLateDeduction: template.AllowLateDeduction,
            AllowOvertime: template.AllowOvertime,
            OvertimeCalculationType: template.AllowOvertime ? otType : "None",
            OvertimeMultiplier: template.OtMultiplier,
            OvertimeDivisor: template.OtDivisor,
            MonthDayCalculationType: template.MonthDayCalculationType,
            FixedMonthDays: template.FixedMonthDays,
            AllowTiffinBill: template.AllowTiffinBill,
            AllowNightBill: template.AllowNightBill,
            AllowAttendanceBonus: template.AllowAttendanceBonus,
            AllowEarnLeaveEncashment: template.AllowEarnLeaveEncashment,
            FixedOvertimeRate: assignment.FixedOvertimeRate,
            AbsentDeductionBase: template.AbsentBase,
            AbsentDayDivisor: template.AbsentDayDivisor,
            FixedAbsentDays: template.FixedAbsentDays,
            PolicyCode: template.PolicyCode);
    }

    public static string BuildSnapshotJson(PayrollPolicyTemplate template, CompanyPayrollPolicyAssignment assignment) =>
        JsonSerializer.Serialize(new
        {
            template.PolicyCode,
            template.Version,
            template.PolicyName,
            template.ComplianceMode,
            template.OtBase,
            template.OtDivisor,
            template.OtMultiplier,
            template.AbsentBase,
            template.AbsentDayDivisor,
            assignment.FixedOvertimeRate,
        });
}
