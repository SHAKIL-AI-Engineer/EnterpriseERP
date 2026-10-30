using Erp.BuildingBlocks.CommonSecurity;
using Erp.BuildingBlocks.ReportExport;
using Erp.BuildingBlocks.ReportExport.Mvc;
using HRService.Application.Employees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRService.Api.Controllers;

[ApiController]
[Route("api/v1/hr/reports")]
[Authorize]
public sealed class HrReportsExportController(
    IEmployeeReadService employees,
    IEmployeeImportService employeeImport,
    ITenantContext tenant,
    IReportExportClient exporter) : ControllerBase
{
    [HttpGet("employees/export.{format}")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<IActionResult> Employees(
        [FromQuery] EmployeeListQuery query,
        string format,
        CancellationToken cancellationToken)
    {
        query.CompanyId = TenantCompanyResolver.ResolveCompanyId(tenant, query.CompanyId);
        query.GetAll = true;
        query.PageSize = 5000;
        query.Normalize();

        var result = await employees.ListAsync(query, cancellationToken);
        var request = ReportExportMapper.Build(
            "Employee List",
            ReportExportControllerExtensions.NormalizeFormat(format),
            result.Data,
            EmployeeListColumns(),
            HrMeta(query));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("employees/full/export.{format}")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<IActionResult> EmployeesFull(
        [FromQuery] Guid? companyId,
        string format,
        CancellationToken cancellationToken)
    {
        var resolved = TenantCompanyResolver.ResolveCompanyId(tenant, companyId);
        var rows = await employeeImport.ExportAsync(resolved, cancellationToken);
        var request = ReportExportMapper.Build(
            "Employee Export",
            ReportExportControllerExtensions.NormalizeFormat(format),
            rows,
            EmployeeFullColumns(),
            ReportExportMapper.MetaWithFilters(new Dictionary<string, string>
            {
                ["CompanyId"] = resolved.ToString(),
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("manpower-list/export.{format}")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<IActionResult> ManpowerList(
        [FromQuery] ManpowerListQuery query,
        string format,
        CancellationToken cancellationToken)
    {
        query.CompanyId = TenantCompanyResolver.ResolveCompanyId(tenant, query.CompanyId);
        query.GetAll = true;
        query.PageSize = 5000;
        query.Normalize();

        var result = await employees.ManpowerListAsync(query, cancellationToken);
        var request = ReportExportMapper.Build(
            "Manpower List",
            ReportExportControllerExtensions.NormalizeFormat(format),
            result.Data,
            ManpowerListColumns(),
            HrMeta(query));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("manpower-summary/export.{format}")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<IActionResult> ManpowerSummary(
        [FromQuery] ManpowerSummaryQuery query,
        string format,
        CancellationToken cancellationToken)
    {
        query.CompanyId = TenantCompanyResolver.ResolveCompanyId(tenant, query.CompanyId);
        var data = await employees.ManpowerSummaryAsync(query, cancellationToken);

        var rows = data.DepartmentSummary
            .Select(b => (IReadOnlyList<string>)[
                "Department", b.Name, b.Count.ToString(), b.Percentage.ToString("0.##")])
            .Concat(data.DesignationSummary.Select(b => (IReadOnlyList<string>)[
                "Designation", b.Name, b.Count.ToString(), b.Percentage.ToString("0.##")]))
            .Concat(data.GenderSummary.Select(b => (IReadOnlyList<string>)[
                "Gender", b.Name, b.Count.ToString(), b.Percentage.ToString("0.##")]))
            .Concat(data.StatusSummary.Select(b => (IReadOnlyList<string>)[
                "Status", b.Name, b.Count.ToString(), b.Percentage.ToString("0.##")]))
            .ToList();

        var meta = HrMeta(query);
        meta["TotalEmployees"] = data.TotalEmployees.ToString();
        meta["ActiveEmployees"] = data.ActiveEmployees.ToString();
        meta["OnLeaveEmployees"] = data.OnLeaveEmployees.ToString();
        meta["InactiveEmployees"] = data.InactiveEmployees.ToString();

        var request = new ReportExportRequestDto(
            "Manpower Summary",
            ReportExportControllerExtensions.NormalizeFormat(format),
            ["Level", "Name", "Count", "Percentage"],
            rows,
            meta);
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    private static Dictionary<string, string> HrMeta(EmployeeListQuery query) =>
        ReportExportMapper.MetaWithFilters(new Dictionary<string, string>
        {
            ["CompanyId"] = query.CompanyId?.ToString() ?? "",
            ["DepartmentId"] = query.DepartmentId?.ToString() ?? "",
            ["SectionId"] = query.SectionId?.ToString() ?? "",
            ["DesignationId"] = query.DesignationId?.ToString() ?? "",
            ["Status"] = query.Status ?? "",
            ["Gender"] = query.Gender ?? "",
            ["EmployeeID"] = query.EmployeeId ?? "",
            ["JoinDateFrom"] = query.JoinDateFrom?.ToString("yyyy-MM-dd") ?? "",
            ["JoinDateTo"] = query.JoinDateTo?.ToString("yyyy-MM-dd") ?? "",
            ["Search"] = query.Search ?? "",
        });

    private static IReadOnlyList<ReportColumn<EmployeeListItemDto>> EmployeeListColumns() =>
    [
        new("Employee ID", r => r.EmployeeID),
        new("Name", r => r.FullName),
        new("Department", r => r.DepartmentName ?? ""),
        new("Designation", r => r.DesignationName ?? ""),
        new("Status", r => r.Status),
        new("Gender", r => r.Gender ?? ""),
        new("Join Date", r => r.JoinDate.ToString("yyyy-MM-dd")),
        new("Phone", r => r.Phone ?? ""),
        new("Email", r => r.Email ?? ""),
    ];

    private static IReadOnlyList<ReportColumn<ManpowerListItemDto>> ManpowerListColumns() =>
    [
        new("Employee ID", r => r.EmployeeID),
        new("Name", r => r.FullName),
        new("Department", r => r.DepartmentName ?? ""),
        new("Section", r => r.SectionName ?? ""),
        new("Designation", r => r.DesignationName ?? ""),
        new("Status", r => r.Status),
        new("Join Date", r => r.JoinDate.ToString("yyyy-MM-dd")),
        new("Gross Salary", r => r.GrossSalary.ToString("0.00")),
        new("OT Enabled", r => r.IsOtEnabled ? "Yes" : "No"),
    ];

    private static IReadOnlyList<ReportColumn<EmployeeImportRowDto>> EmployeeFullColumns() =>
    [
        new("Employee ID", r => r.EmployeeID),
        new("Name", r => r.FullName),
        new("Department", r => r.DepartmentName ?? ""),
        new("Section", r => r.SectionName ?? ""),
        new("Designation", r => r.DesignationName ?? ""),
        new("Status", r => r.Status),
        new("Join Date", r => r.JoinDate.ToString("yyyy-MM-dd")),
        new("Basic Salary", r => r.BasicSalary.ToString("0.00")),
        new("Gross Salary", r => (r.BasicSalary + r.HouseRent + r.MedicalAllowance + r.ConveyanceAllowance + r.FoodAllowance).ToString("0.00")),
        new("Phone", r => r.Phone ?? ""),
        new("Email", r => r.Email ?? ""),
    ];
}
