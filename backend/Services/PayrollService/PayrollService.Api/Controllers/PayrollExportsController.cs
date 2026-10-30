using System.Text;
using Erp.BuildingBlocks.ReportExport;
using Erp.BuildingBlocks.ReportExport.Mvc;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/payroll/export")]
public sealed class PayrollExportsController(IMediator mediator, IReportExportClient exporter) : ControllerBase
{
    [HttpGet("salary-sheet")]
    [Authorize(Policy = PayrollPermissions.SalarySheetView)]
    public async Task<IActionResult> SalarySheetCsv(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        CancellationToken cancellationToken) =>
        await ExportSalarySheetCsv(companyId, yearNo, monthNo, null, null, null, null, null, null, cancellationToken);

    [HttpGet("salary-sheet/export.{format}")]
    [Authorize(Policy = PayrollPermissions.SalarySheetView)]
    public async Task<IActionResult> SalarySheetFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        string format,
        [FromQuery] int? departmentId = null,
        [FromQuery] int? sectionId = null,
        [FromQuery] int? designationId = null,
        [FromQuery] int? lineId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new GetSalarySheetQuery(
            companyId, yearNo, monthNo, departmentId, sectionId, designationId, lineId, status, searchTerm), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var request = ReportExportMapper.Build(
            "Salary Sheet",
            ReportExportControllerExtensions.NormalizeFormat(format),
            response.Data,
            SalarySheetColumns(),
            PeriodMeta(companyId, yearNo, monthNo));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("bank-sheet")]
    [Authorize(Policy = PayrollPermissions.BankSheetExport)]
    public async Task<IActionResult> BankSheetCsv(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        CancellationToken cancellationToken) =>
        await ExportBankSheetCsv(companyId, yearNo, monthNo, cancellationToken);

    [HttpGet("bank-sheet/export.{format}")]
    [Authorize(Policy = PayrollPermissions.BankSheetExport)]
    public async Task<IActionResult> BankSheetFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        string format,
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new GetBankSheetQuery(companyId, yearNo, monthNo), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var request = ReportExportMapper.Build(
            "Bank Sheet",
            ReportExportControllerExtensions.NormalizeFormat(format),
            response.Data,
            [
                new ReportColumn<BankSheetRowDto>("Employee ID", r => r.EmployeeId.ToString()),
                new ReportColumn<BankSheetRowDto>("Bank Account", r => r.BankAccountNo),
                new ReportColumn<BankSheetRowDto>("Bank Name", r => r.BankName),
                new ReportColumn<BankSheetRowDto>("Net Salary", r => r.NetSalary.ToString("0.00")),
            ],
            PeriodMeta(companyId, yearNo, monthNo));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> SummaryCsv(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        CancellationToken cancellationToken = default) =>
        await ExportSummaryCsv(companyId, yearNo, monthNo, cancellationToken);

    [HttpGet("summary/export.{format}")]
    public async Task<IActionResult> SummaryFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        string format,
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new GetPayrollSummaryBreakdownQuery(companyId, yearNo, monthNo), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var rows = response.Data.DepartmentSummaries
            .Select(x => (IReadOnlyList<string>)[
                x.Name, x.EmployeeCount.ToString(), x.TotalGrossSalary.ToString("0.00"),
                x.TotalOTAmount.ToString("0.00"), x.TotalDeductions.ToString("0.00"), x.TotalNetPayable.ToString("0.00")])
            .ToList();

        var request = new ReportExportRequestDto(
            "Payroll Summary",
            ReportExportControllerExtensions.NormalizeFormat(format),
            ["Department", "Employees", "Gross", "OT", "Deductions", "Net"],
            rows,
            PeriodMeta(companyId, yearNo, monthNo));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("advance-sheet")]
    public async Task<IActionResult> AdvanceSheetCsv(
        [FromQuery] Guid companyId,
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken cancellationToken) =>
        await ExportAdvanceSheetCsv(companyId, year, month, cancellationToken);

    [HttpGet("advance-sheet/export.{format}")]
    public async Task<IActionResult> AdvanceSheetFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] int? year,
        [FromQuery] int? month,
        string format,
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new ListSalaryAdvancesQuery(companyId, null, year, month), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var request = ReportExportMapper.Build(
            "Advance Salary Sheet",
            ReportExportControllerExtensions.NormalizeFormat(format),
            response.Data,
            [
                new ReportColumn<SalaryAdvanceDto>("Advance No", r => r.AdvanceNo),
                new ReportColumn<SalaryAdvanceDto>("Employee ID", r => r.EmployeeId.ToString()),
                new ReportColumn<SalaryAdvanceDto>("Amount", r => r.AdvanceAmount.ToString("0.00")),
                new ReportColumn<SalaryAdvanceDto>("Balance", r => r.BalanceAmount.ToString("0.00")),
                new ReportColumn<SalaryAdvanceDto>("Status", r => r.Status),
                new ReportColumn<SalaryAdvanceDto>("Advance Date", r => r.AdvanceDate.ToString("yyyy-MM-dd")),
            ],
            ReportExportMapper.MetaWithFilters(new Dictionary<string, string>
            {
                ["CompanyId"] = companyId.ToString(),
                ["Year"] = year?.ToString() ?? "",
                ["Month"] = month?.ToString() ?? "",
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("advance-summary/export.{format}")]
    public async Task<IActionResult> AdvanceSummaryFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] int? year,
        [FromQuery] int? month,
        string format,
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new GetSalaryAdvanceSummaryQuery(companyId, year, month), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var summary = response.Data;
        var rows = new List<IReadOnlyList<string>>
        {
            new List<string> { "Total Count", summary.TotalCount.ToString() },
            new List<string> { "Total Amount", summary.TotalAmount.ToString("0.00") },
            new List<string> { "Total Balance", summary.TotalBalance.ToString("0.00") },
            new List<string> { "Approved Count", summary.ApprovedCount.ToString() },
            new List<string> { "Pending Count", summary.PendingCount.ToString() },
        };

        var request = new ReportExportRequestDto(
            "Advance Salary Summary",
            ReportExportControllerExtensions.NormalizeFormat(format),
            ["Metric", "Value"],
            rows,
            ReportExportMapper.MetaWithFilters(new Dictionary<string, string>
            {
                ["CompanyId"] = companyId.ToString(),
                ["Year"] = year?.ToString() ?? "",
                ["Month"] = month?.ToString() ?? "",
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("daily-sheet")]
    public async Task<IActionResult> DailySheetCsv(
        [FromQuery] Guid companyId,
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken) =>
        await ExportDailySheetCsv(companyId, date, cancellationToken);

    [HttpGet("daily-sheet/export.{format}")]
    public async Task<IActionResult> DailySheetFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] DateOnly date,
        string format,
        [FromQuery] int? departmentId = null,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new GetDailySalarySheetQuery(companyId, date, departmentId, searchTerm), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var request = ReportExportMapper.Build(
            "Daily Salary Sheet",
            ReportExportControllerExtensions.NormalizeFormat(format),
            response.Data,
            [
                new ReportColumn<DailySalarySheetRowDto>("Employee Code", r => r.EmployeeCode ?? ""),
                new ReportColumn<DailySalarySheetRowDto>("Name", r => r.EmployeeName ?? ""),
                new ReportColumn<DailySalarySheetRowDto>("Date", r => r.Date.ToString("yyyy-MM-dd")),
                new ReportColumn<DailySalarySheetRowDto>("Per Day", r => r.PerDaySalary.ToString("0.00")),
                new ReportColumn<DailySalarySheetRowDto>("OT", r => r.OtAmount.ToString("0.00")),
                new ReportColumn<DailySalarySheetRowDto>("Earning", r => r.TotalEarning.ToString("0.00")),
                new ReportColumn<DailySalarySheetRowDto>("Deduction", r => r.Deduction.ToString("0.00")),
                new ReportColumn<DailySalarySheetRowDto>("Net", r => r.NetPayable.ToString("0.00")),
            ],
            ReportExportMapper.MetaWithFilters(new Dictionary<string, string>
            {
                ["CompanyId"] = companyId.ToString(),
                ["Date"] = date.ToString("yyyy-MM-dd"),
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("bonuses")]
    public async Task<IActionResult> BonusesCsv(
        [FromQuery] Guid companyId,
        [FromQuery] int year,
        [FromQuery] int? month,
        CancellationToken cancellationToken) =>
        await ExportBonusesCsv(companyId, year, month, cancellationToken);

    [HttpGet("bonuses/export.{format}")]
    public async Task<IActionResult> BonusesFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] int year,
        [FromQuery] int? month,
        string format,
        [FromQuery] string? bonusType = null,
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new GetPayrollBonusesQuery(companyId, year, month, bonusType), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var request = ReportExportMapper.Build(
            string.IsNullOrWhiteSpace(bonusType) ? "Payroll Bonuses" : $"{bonusType} Bonus",
            ReportExportControllerExtensions.NormalizeFormat(format),
            response.Data,
            [
                new ReportColumn<PayrollBonusRowDto>("Employee ID", r => r.EmployeeId.ToString()),
                new ReportColumn<PayrollBonusRowDto>("Name", r => r.EmployeeName ?? ""),
                new ReportColumn<PayrollBonusRowDto>("Bonus Type", r => r.BonusType),
                new ReportColumn<PayrollBonusRowDto>("Amount", r => r.Amount.ToString("0.00")),
                new ReportColumn<PayrollBonusRowDto>("Status", r => r.Status),
            ],
            ReportExportMapper.MetaWithFilters(new Dictionary<string, string>
            {
                ["CompanyId"] = companyId.ToString(),
                ["Year"] = year.ToString(),
                ["Month"] = month?.ToString() ?? "",
                ["BonusType"] = bonusType ?? "",
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("festival-bonus-bank/export.{format}")]
    public async Task<IActionResult> FestivalBonusBankFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        string format,
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new GetFestivalBonusBankSheetQuery(companyId, yearNo, monthNo), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var request = ReportExportMapper.Build(
            "Festival Bonus Bank Sheet",
            ReportExportControllerExtensions.NormalizeFormat(format),
            response.Data,
            [
                new ReportColumn<FestivalBonusBankSheetRowDto>("Employee ID", r => r.EmployeeId.ToString()),
                new ReportColumn<FestivalBonusBankSheetRowDto>("Bank Account", r => r.BankAccountNo ?? string.Empty),
                new ReportColumn<FestivalBonusBankSheetRowDto>("Bank Name", r => r.BankName ?? string.Empty),
                new ReportColumn<FestivalBonusBankSheetRowDto>("Bonus Amount", r => r.NetPayable.ToString("0.00")),
            ],
            PeriodMeta(companyId, yearNo, monthNo));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("pay-slips/export.{format}")]
    [Authorize(Policy = PayrollPermissions.PayslipView)]
    public async Task<IActionResult> PaySlipsFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        string format,
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new GetEmployeePayrollQuery(companyId, yearNo, monthNo, null), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var request = ReportExportMapper.Build(
            "Pay Slips",
            ReportExportControllerExtensions.NormalizeFormat(format),
            response.Data,
            [
                new ReportColumn<EmployeePayrollDto>("Employee ID", r => r.EmployeeId.ToString()),
                new ReportColumn<EmployeePayrollDto>("Gross", r => r.GrossSalary.ToString("0.00")),
                new ReportColumn<EmployeePayrollDto>("Basic", r => r.BasicSalary.ToString("0.00")),
                new ReportColumn<EmployeePayrollDto>("Earnings", r => r.TotalEarnings.ToString("0.00")),
                new ReportColumn<EmployeePayrollDto>("Deduction", r => r.TotalDeduction.ToString("0.00")),
                new ReportColumn<EmployeePayrollDto>("Net", r => r.NetSalary.ToString("0.00")),
                new ReportColumn<EmployeePayrollDto>("Status", r => r.Status),
            ],
            PeriodMeta(companyId, yearNo, monthNo));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("monthly-sheet/export.{format}")]
    [Authorize(Policy = PayrollPermissions.SalarySheetView)]
    public Task<IActionResult> MonthlySheetFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        string format,
        [FromQuery] int? departmentId = null,
        [FromQuery] int? sectionId = null,
        [FromQuery] int? designationId = null,
        [FromQuery] int? lineId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default) =>
        SalarySheetFormatted(companyId, yearNo, monthNo, format, departmentId, sectionId, designationId, lineId, status, searchTerm, cancellationToken);

    private async Task<IActionResult> ExportSalarySheetCsv(
        Guid companyId, int yearNo, int monthNo,
        int? departmentId, int? sectionId, int? designationId, int? lineId, string? status, string? searchTerm,
        CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetSalarySheetQuery(
            companyId, yearNo, monthNo, departmentId, sectionId, designationId, lineId, status, searchTerm), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        return CsvFile(
            "salary-sheet.csv",
            ["EmployeeCode", "EmployeeName", "Department", "Designation", "Gross", "Basic", "Earnings", "Deduction", "Net", "Status"],
            response.Data.Select(x => new[]
            {
                x.EmployeeCode ?? "",
                x.EmployeeName ?? "",
                x.DepartmentName ?? "",
                x.DesignationName ?? "",
                x.GrossSalary.ToString("0.00"),
                x.BasicSalary.ToString("0.00"),
                x.TotalEarnings.ToString("0.00"),
                x.TotalDeduction.ToString("0.00"),
                x.NetSalary.ToString("0.00"),
                x.Status
            }));
    }

    private async Task<IActionResult> ExportBankSheetCsv(Guid companyId, int yearNo, int monthNo, CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetBankSheetQuery(companyId, yearNo, monthNo), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        return CsvFile(
            "bank-sheet.csv",
            ["EmployeeId", "BankAccountNo", "BankName", "NetSalary"],
            response.Data.Select(x => new[] { x.EmployeeId.ToString(), x.BankAccountNo, x.BankName, x.NetSalary.ToString("0.00") }));
    }

    private async Task<IActionResult> ExportSummaryCsv(Guid companyId, int yearNo, int monthNo, CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetPayrollSummaryBreakdownQuery(companyId, yearNo, monthNo), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        var rows = response.Data.DepartmentSummaries.Select(x => new[]
        {
            x.Name,
            x.EmployeeCount.ToString(),
            x.TotalGrossSalary.ToString("0.00"),
            x.TotalOTAmount.ToString("0.00"),
            x.TotalDeductions.ToString("0.00"),
            x.TotalNetPayable.ToString("0.00")
        });

        return CsvFile("summary.csv", ["Department", "Employees", "Gross", "OT", "Deductions", "Net"], rows);
    }

    private async Task<IActionResult> ExportAdvanceSheetCsv(Guid companyId, int? year, int? month, CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new ListSalaryAdvancesQuery(companyId, null, year, month), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        return CsvFile(
            "advance-sheet.csv",
            ["AdvanceNo", "EmployeeId", "Amount", "Balance", "Status", "AdvanceDate"],
            response.Data.Select(x => new[]
            {
                x.AdvanceNo,
                x.EmployeeId.ToString(),
                x.AdvanceAmount.ToString("0.00"),
                x.BalanceAmount.ToString("0.00"),
                x.Status,
                x.AdvanceDate.ToString("yyyy-MM-dd")
            }));
    }

    private async Task<IActionResult> ExportDailySheetCsv(Guid companyId, DateOnly date, CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetDailySalarySheetQuery(companyId, date, null, null), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        return CsvFile(
            "daily-sheet.csv",
            ["EmployeeCode", "EmployeeName", "Date", "PerDay", "OT", "Earning", "Deduction", "Net"],
            response.Data.Select(x => new[]
            {
                x.EmployeeCode ?? "",
                x.EmployeeName ?? "",
                x.Date.ToString("yyyy-MM-dd"),
                x.PerDaySalary.ToString("0.00"),
                x.OtAmount.ToString("0.00"),
                x.TotalEarning.ToString("0.00"),
                x.Deduction.ToString("0.00"),
                x.NetPayable.ToString("0.00")
            }));
    }

    private async Task<IActionResult> ExportBonusesCsv(Guid companyId, int year, int? month, CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetPayrollBonusesQuery(companyId, year, month, null), cancellationToken);
        if (!response.Success || response.Data is null)
            return BadRequest(response);

        return CsvFile(
            "bonuses.csv",
            ["EmployeeId", "EmployeeName", "BonusType", "Amount", "Status"],
            response.Data.Select(x => new[]
            {
                x.EmployeeId.ToString(),
                x.EmployeeName ?? "",
                x.BonusType,
                x.Amount.ToString("0.00"),
                x.Status
            }));
    }

    private static Dictionary<string, string> PeriodMeta(Guid companyId, int yearNo, int monthNo) =>
        ReportExportMapper.MetaWithFilters(new Dictionary<string, string>
        {
            ["CompanyId"] = companyId.ToString(),
            ["Year"] = yearNo.ToString(),
            ["Month"] = monthNo.ToString(),
        });

    private static IReadOnlyList<ReportColumn<SalarySheetRowDto>> SalarySheetColumns() =>
    [
        new("Employee Code", r => r.EmployeeCode ?? ""),
        new("Name", r => r.EmployeeName ?? ""),
        new("Department", r => r.DepartmentName ?? ""),
        new("Designation", r => r.DesignationName ?? ""),
        new("Gross", r => r.GrossSalary.ToString("0.00")),
        new("Basic", r => r.BasicSalary.ToString("0.00")),
        new("Earnings", r => r.TotalEarnings.ToString("0.00")),
        new("Deduction", r => r.TotalDeduction.ToString("0.00")),
        new("Net", r => r.NetSalary.ToString("0.00")),
        new("Status", r => r.Status),
    ];

    private static FileContentResult CsvFile(string fileName, IReadOnlyList<string> headers, IEnumerable<string[]> rows)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(',', headers.Select(Escape)));
        foreach (var row in rows)
            sb.AppendLine(string.Join(',', row.Select(Escape)));

        return new FileContentResult(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv")
        {
            FileDownloadName = fileName
        };
    }

    private static string Escape(string value) => $"\"{value.Replace("\"", "\"\"")}\"";
}
