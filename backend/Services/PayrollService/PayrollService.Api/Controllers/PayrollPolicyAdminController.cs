using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Authorize(Policy = PayrollPermissions.PayrollPolicyManage)]
public sealed class PayrollPolicyAdminController(IMediator mediator) : ControllerBase
{
    [HttpGet("api/v1/admin/payroll/policy-templates")]
    public async Task<IActionResult> GetTemplates() =>
        Ok(await mediator.Send(new GetPayrollPolicyTemplatesQuery()));

    [HttpGet("api/v1/admin/payroll/company-policy/{companyId:guid}")]
    public async Task<IActionResult> GetCompanyPolicy(Guid companyId) =>
        Ok(await mediator.Send(new GetAdminCompanyPayrollPolicyQuery(companyId)));

    [HttpPost("api/v1/admin/payroll/company-policy/assign")]
    public async Task<IActionResult> AssignCompanyPolicy(AssignCompanyPayrollPolicyRequest request) =>
        Ok(await mediator.Send(new AssignCompanyPayrollPolicyCommand(request with { AssignedBy = Guid.Parse(User.FindFirstValue("sub")!) })));

    [HttpPost("api/v1/admin/payroll/policy-templates/{policyCode}/test-calculate")]
    public async Task<IActionResult> TestCalculate(string policyCode, PolicyTestCalculateRequest request) =>
        Ok(await mediator.Send(new TestPayrollPolicyCalculationQuery(policyCode, request)));
}
