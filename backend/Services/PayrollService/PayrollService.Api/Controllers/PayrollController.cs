using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
public sealed class PayrollController(IMediator mediator) : ControllerBase
{
    [HttpGet("api/v1/payroll/company-policy")]
    public async Task<IActionResult> GetCompanyPolicy([FromQuery] Guid companyId) =>
        Ok(await mediator.Send(new GetCompanyPayrollPolicySummaryQuery(companyId)));

    [HttpPost("api/v1/payroll/process")]
    [Authorize(Policy = PayrollPermissions.PayrollProcess)]
    public async Task<IActionResult> Process(ProcessPayrollRequest request)
    {
        var result = await mediator.Send(new ProcessPayrollCommand(request with { ProcessedBy = Guid.Parse(User.FindFirstValue("sub")!) }));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("api/v1/payroll/reprocess")]
    [Authorize(Policy = PayrollPermissions.PayrollReprocess)]
    public async Task<IActionResult> Reprocess(ProcessPayrollRequest request)
    {
        var result = await mediator.Send(new ReprocessPayrollCommand(request with { ProcessedBy = Guid.Parse(User.FindFirstValue("sub")!) }));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("api/v1/payroll/salary-sheet")]
    [Authorize(Policy = PayrollPermissions.SalarySheetView)]
    public async Task<IActionResult> SalarySheet(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        [FromQuery] int? departmentId,
        [FromQuery] int? sectionId,
        [FromQuery] int? designationId,
        [FromQuery] int? lineId,
        [FromQuery] string? status,
        [FromQuery] string? searchTerm) =>
        Ok(await mediator.Send(new GetSalarySheetQuery(
            companyId, yearNo, monthNo, departmentId, sectionId, designationId, lineId, status, searchTerm)));

    [HttpGet("api/v1/payroll/summary")]
    public async Task<IActionResult> Summary(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo) =>
        Ok(await mediator.Send(new GetPayrollSummaryQuery(companyId, yearNo, monthNo)));

    [HttpGet("api/v1/payroll/summary/breakdown")]
    public async Task<IActionResult> SummaryBreakdown(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo) =>
        Ok(await mediator.Send(new GetPayrollSummaryBreakdownQuery(companyId, yearNo, monthNo)));

    [HttpGet("api/v1/payroll/bank-sheet")]
    [Authorize(Policy = PayrollPermissions.BankSheetExport)]
    public async Task<IActionResult> BankSheet(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo) =>
        Ok(await mediator.Send(new GetBankSheetQuery(companyId, yearNo, monthNo)));

    [HttpGet("api/v1/payroll/employees")]
    public async Task<IActionResult> GetEmployees(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        [FromQuery] int? departmentId,
        [FromQuery] int? sectionId,
        [FromQuery] int? designationId,
        [FromQuery] int? lineId,
        [FromQuery] string? status,
        [FromQuery] string? searchTerm) =>
        Ok(await mediator.Send(new GetEmployeePayrollQuery(
            companyId, yearNo, monthNo, null, departmentId, sectionId, designationId, lineId, status, searchTerm)));

    [HttpGet("api/v1/payroll/employees/{employeeId:guid}")]
    public async Task<IActionResult> GetEmployee(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        Guid employeeId) =>
        Ok(await mediator.Send(new GetEmployeePayrollQuery(companyId, yearNo, monthNo, employeeId)));

    [HttpGet("api/v1/payroll/payslips")]
    [Authorize(Policy = PayrollPermissions.PayslipView)]
    public async Task<IActionResult> Payslips(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo) =>
        Ok(await mediator.Send(new GetEmployeePayrollQuery(companyId, yearNo, monthNo, null)));

    [HttpGet("api/v1/payroll/payslips/{employeeId:guid}")]
    [Authorize(Policy = PayrollPermissions.PayslipView)]
    public async Task<IActionResult> Payslip(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        Guid employeeId) =>
        Ok(await mediator.Send(new GetPayslipQuery(companyId, yearNo, monthNo, employeeId)));
}
