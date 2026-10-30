using MediatR;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;

using Erp.BuildingBlocks.SharedKernel;

namespace PayrollService.Application.Handlers;

public sealed class PayrollPolicyAdminHandlers(
    IPayrollDbContext db,
    ISalaryStructureCalculator salaryStructureCalculator,
    IPayrollCalculationService payrollCalculationService) :
    IRequestHandler<GetPayrollPolicyTemplatesQuery, ApiResponse<IReadOnlyList<PayrollPolicyTemplateDto>>>,
    IRequestHandler<GetAdminCompanyPayrollPolicyQuery, ApiResponse<CompanyPayrollPolicyAssignmentDto?>>,
    IRequestHandler<GetCompanyPayrollPolicySummaryQuery, ApiResponse<CompanyPayrollPolicySummaryDto?>>,
    IRequestHandler<AssignCompanyPayrollPolicyCommand, ApiResponse<CompanyPayrollPolicyAssignmentDto>>,
    IRequestHandler<TestPayrollPolicyCalculationQuery, ApiResponse<PolicyTestCalculateResultDto>>
{
    public Task<ApiResponse<IReadOnlyList<PayrollPolicyTemplateDto>>> Handle(
        GetPayrollPolicyTemplatesQuery query,
        CancellationToken cancellationToken)
    {
        var templates = db.PayrollPolicyTemplates
            .Where(x => x.Status == "Active")
            .OrderBy(x => x.PolicyCode)
            .Select(ToTemplateDto)
            .ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<PayrollPolicyTemplateDto>>.Ok(templates));
    }

    public Task<ApiResponse<CompanyPayrollPolicyAssignmentDto?>> Handle(
        GetAdminCompanyPayrollPolicyQuery query,
        CancellationToken cancellationToken)
    {
        var assignment = GetActiveAssignment(query.CompanyId);
        return Task.FromResult(ApiResponse<CompanyPayrollPolicyAssignmentDto?>.Ok(
            assignment is null ? null : ToAssignmentDto(assignment)));
    }

    public async Task<ApiResponse<CompanyPayrollPolicySummaryDto?>> Handle(
        GetCompanyPayrollPolicySummaryQuery query,
        CancellationToken cancellationToken)
    {
        var resolved = await new PolicyResolver(db).TryResolveAsync(query.CompanyId, DateOnly.FromDateTime(BusinessTime.Now), cancellationToken);
        if (resolved is null)
        {
            return ApiResponse<CompanyPayrollPolicySummaryDto?>.Ok(null);
        }

        return ApiResponse<CompanyPayrollPolicySummaryDto?>.Ok(new CompanyPayrollPolicySummaryDto(
            query.CompanyId,
            resolved.Template.PolicyCode,
            resolved.Template.PolicyName,
            resolved.Template.Version,
            resolved.Assignment.FixedOvertimeRate,
            resolved.Assignment.EffectiveFrom));
    }

    public async Task<ApiResponse<CompanyPayrollPolicyAssignmentDto>> Handle(
        AssignCompanyPayrollPolicyCommand command,
        CancellationToken cancellationToken)
    {
        var request = command.Request;
        var template = db.PayrollPolicyTemplates
            .FirstOrDefault(x => x.PolicyCode == request.PolicyCode && x.Status == "Active");
        if (template is null)
        {
            return ApiResponse<CompanyPayrollPolicyAssignmentDto>.Fail("Policy template not found.");
        }

        if (string.Equals(template.OtBase, "Fixed", StringComparison.OrdinalIgnoreCase) &&
            (!request.FixedOvertimeRate.HasValue || request.FixedOvertimeRate <= 0))
        {
            return ApiResponse<CompanyPayrollPolicyAssignmentDto>.Fail("Fixed overtime rate is required for this policy.");
        }

        foreach (var existing in db.CompanyPayrollPolicyAssignments
                     .Where(x => x.CompanyId == request.CompanyId && x.IsActive)
                     .ToList())
        {
            existing.IsActive = false;
        }

        var assignment = new CompanyPayrollPolicyAssignment
        {
            CompanyId = request.CompanyId,
            PolicyTemplateId = template.Id,
            FixedOvertimeRate = request.FixedOvertimeRate,
            EffectiveFrom = request.EffectiveFrom,
            IsActive = true,
            AssignedBy = request.AssignedBy,
            AssignedAt = BusinessTime.Now,
        };
        db.Add(assignment);
        await db.SaveChangesAsync(cancellationToken);

        assignment.PolicyTemplate = template;
        return ApiResponse<CompanyPayrollPolicyAssignmentDto>.Ok(ToAssignmentDto(assignment), "Company payroll policy assigned.");
    }

    public Task<ApiResponse<PolicyTestCalculateResultDto>> Handle(
        TestPayrollPolicyCalculationQuery query,
        CancellationToken cancellationToken)
    {
        var template = db.PayrollPolicyTemplates
            .FirstOrDefault(x => x.PolicyCode == query.PolicyCode && x.Status == "Active");
        if (template is null)
        {
            return Task.FromResult(ApiResponse<PolicyTestCalculateResultDto>.Fail("Policy template not found."));
        }

        var assignment = new CompanyPayrollPolicyAssignment
        {
            CompanyId = Guid.Empty,
            PolicyTemplateId = template.Id,
            FixedOvertimeRate = query.Request.FixedOvertimeRate,
            EffectiveFrom = DateOnly.FromDateTime(BusinessTime.Now),
            IsActive = true,
        };
        var settings = PolicyResolver.ToSettings(template, assignment);
        var structure = salaryStructureCalculator.Calculate(query.Request.GrossSalary, template);
        var salary = new EmployeeSalary
        {
            GrossSalary = structure.GrossSalary,
            BasicSalary = structure.BasicSalary,
            HouseRent = structure.HouseRent,
            MedicalAllowance = structure.MedicalAllowance,
            FoodAllowance = structure.FoodAllowance,
            ConveyanceAllowance = structure.ConveyanceAllowance,
            SalaryCalculationType = "Monthly",
        };
        var attendance = new AttendanceSummary(
            Guid.Empty,
            Guid.Empty,
            query.Request.YearNo,
            query.Request.MonthNo,
            true,
            DateTime.DaysInMonth(query.Request.YearNo, query.Request.MonthNo),
            26,
            26,
            query.Request.AbsentDays,
            0,
            0,
            0,
            0,
            0,
            0,
            (int)query.Request.OvertimeHours,
            0,
            0,
            0);

        var calc = payrollCalculationService.Calculate(settings, salary, attendance, new PayrollCalculationInputs(), "Monthly");
        var result = new PolicyTestCalculateResultDto(
            structure.BasicSalary,
            structure.HouseRent,
            structure.MedicalAllowance,
            structure.FoodAllowance,
            structure.ConveyanceAllowance,
            calc.OvertimeRate,
            calc.OvertimeAmount,
            calc.AbsentDeduction,
            calc.NetSalary);

        return Task.FromResult(ApiResponse<PolicyTestCalculateResultDto>.Ok(result));
    }

    private CompanyPayrollPolicyAssignment? GetActiveAssignment(Guid companyId)
    {
        var assignment = db.CompanyPayrollPolicyAssignments
            .Where(x => x.CompanyId == companyId && x.IsActive)
            .OrderByDescending(x => x.EffectiveFrom)
            .ThenByDescending(x => x.AssignedAt)
            .FirstOrDefault();
        if (assignment is null)
        {
            return null;
        }

        assignment.PolicyTemplate = db.PayrollPolicyTemplates.FirstOrDefault(x => x.Id == assignment.PolicyTemplateId);
        return assignment.PolicyTemplate is null ? null : assignment;
    }

    private static PayrollPolicyTemplateDto ToTemplateDto(PayrollPolicyTemplate template) =>
        new(
            template.Id,
            template.PolicyCode,
            template.PolicyName,
            template.Version,
            template.ComplianceMode,
            template.OtBase,
            template.OtDivisor,
            template.OtMultiplier,
            template.AbsentBase,
            template.AbsentDayDivisor,
            template.MonthDayCalculationType,
            template.RequireAttendanceApproval,
            BuildSummary(template));

    private static CompanyPayrollPolicyAssignmentDto ToAssignmentDto(CompanyPayrollPolicyAssignment assignment)
    {
        var template = assignment.PolicyTemplate
            ?? throw new InvalidOperationException("Policy template is required.");
        return new CompanyPayrollPolicyAssignmentDto(
            assignment.Id,
            assignment.CompanyId,
            assignment.PolicyTemplateId,
            template.PolicyCode,
            template.PolicyName,
            template.Version,
            assignment.FixedOvertimeRate,
            assignment.EffectiveFrom,
            assignment.IsActive,
            assignment.AssignedAt);
    }

    private static string BuildSummary(PayrollPolicyTemplate template)
    {
        var ot = template.OtBase.ToUpperInvariant() switch
        {
            "GROSS" => $"Gross / {template.OtDivisor} x {template.OtMultiplier}",
            "FIXED" => "Fixed rate per hour (set on company assignment)",
            _ => $"Basic / {template.OtDivisor} x {template.OtMultiplier}",
        };
        var absent = string.Equals(template.AbsentBase, "Basic", StringComparison.OrdinalIgnoreCase)
            ? $"Basic / {template.FixedAbsentDays ?? 30}"
            : "Gross / calendar days";
        return $"Structure: (Gross-2450)/1.5 Basic; OT: {ot}; Absent: {absent}";
    }
}
