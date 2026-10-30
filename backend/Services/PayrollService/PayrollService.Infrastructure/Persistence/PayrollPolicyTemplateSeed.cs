using PayrollService.Domain.Entities;

namespace PayrollService.Infrastructure.Persistence;

public static class PayrollPolicyTemplateSeed
{
    public static readonly Guid ComplianceId = Guid.Parse("a1000001-0000-0000-0000-000000000001");
    public static readonly Guid NonComplianceGrossOtId = Guid.Parse("a1000002-0000-0000-0000-000000000002");
    public static readonly Guid NonComplianceGross240OtId = Guid.Parse("a1000003-0000-0000-0000-000000000003");
    public static readonly Guid NonComplianceFixedOtId = Guid.Parse("a1000004-0000-0000-0000-000000000004");

    public static IReadOnlyList<PayrollPolicyTemplate> CreateTemplates()
    {
        var createdAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        return
        [
            new PayrollPolicyTemplate
            {
                Id = ComplianceId,
                PolicyCode = "BDT_COMPLIANCE_V1",
                PolicyName = "Bangladesh Full Compliance Salary Rule",
                Version = 1,
                Status = "Active",
                ComplianceMode = "FullCompliance",
                FixedMedical = 750,
                FixedFood = 1250,
                FixedConveyance = 450,
                BasicDivisor = 1.5m,
                OtBase = "Basic",
                OtDivisor = 208,
                OtMultiplier = 2,
                AbsentBase = "Basic",
                AbsentDayDivisor = "FixedDays",
                FixedAbsentDays = 30,
                MonthDayCalculationType = "FixedDays",
                FixedMonthDays = 30,
                RequireAttendanceApproval = true,
                AllowAbsentDeduction = true,
                AllowOvertime = true,
                AllowEarnLeaveEncashment = true,
                AllowFestivalBonus = true,
                CreatedAt = createdAt,
            },
            new PayrollPolicyTemplate
            {
                Id = NonComplianceGrossOtId,
                PolicyCode = "BDT_NONCOMPLIANCE_GROSS_OT_V1",
                PolicyName = "Non-Compliance Gross OT",
                Version = 1,
                Status = "Active",
                ComplianceMode = "NonCompliance",
                FixedMedical = 750,
                FixedFood = 1250,
                FixedConveyance = 450,
                BasicDivisor = 1.5m,
                OtBase = "Gross",
                OtDivisor = 208,
                OtMultiplier = 2,
                AbsentBase = "Gross",
                AbsentDayDivisor = "CalendarDays",
                MonthDayCalculationType = "CalendarDays",
                RequireAttendanceApproval = false,
                AllowAbsentDeduction = true,
                AllowOvertime = true,
                CreatedAt = createdAt,
            },
            new PayrollPolicyTemplate
            {
                Id = NonComplianceGross240OtId,
                PolicyCode = "BDT_NONCOMPLIANCE_GROSS240_OT_V1",
                PolicyName = "Non-Compliance Gross 240 OT",
                Version = 1,
                Status = "Active",
                ComplianceMode = "NonCompliance",
                FixedMedical = 750,
                FixedFood = 1250,
                FixedConveyance = 450,
                BasicDivisor = 1.5m,
                OtBase = "Gross",
                OtDivisor = 240,
                OtMultiplier = 1.5m,
                AbsentBase = "Gross",
                AbsentDayDivisor = "CalendarDays",
                MonthDayCalculationType = "CalendarDays",
                RequireAttendanceApproval = false,
                AllowAbsentDeduction = true,
                AllowOvertime = true,
                CreatedAt = createdAt,
            },
            new PayrollPolicyTemplate
            {
                Id = NonComplianceFixedOtId,
                PolicyCode = "BDT_NONCOMPLIANCE_FIXED_OT_V1",
                PolicyName = "Non-Compliance Fixed OT Rate",
                Version = 1,
                Status = "Active",
                ComplianceMode = "NonCompliance",
                FixedMedical = 750,
                FixedFood = 1250,
                FixedConveyance = 450,
                BasicDivisor = 1.5m,
                OtBase = "Fixed",
                OtDivisor = 208,
                OtMultiplier = 2,
                AbsentBase = "Gross",
                AbsentDayDivisor = "CalendarDays",
                MonthDayCalculationType = "CalendarDays",
                RequireAttendanceApproval = false,
                AllowAbsentDeduction = true,
                AllowOvertime = true,
                CreatedAt = createdAt,
            },
        ];
    }
}
