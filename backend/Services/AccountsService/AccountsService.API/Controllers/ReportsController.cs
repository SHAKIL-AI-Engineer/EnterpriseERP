using System.Text;
using System.IO.Compression;
using AccountsService.Application;
using AccountsService.Contracts;
using AccountsService.Domain;
using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Erp.BuildingBlocks.SharedKernel;

namespace AccountsService.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}")]
public sealed class ReportsController(IMediator mediator, IReportExportClient exporter) : ControllerBase
{
    [HttpGet("ledger"), Authorize(Policy = AccountsPermissions.LedgerView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GeneralLedgerEntryDto>>>> Ledger([FromQuery] Guid companyId, [FromQuery] Guid? accountId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<GeneralLedgerEntryDto>>.Ok(await mediator.Send(new GetGeneralLedgerQuery(companyId, accountId, fromDate, toDate), ct)));
    [HttpGet("cash-book"), Authorize(Policy = AccountsPermissions.LedgerView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GeneralLedgerEntryDto>>>> CashBook([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<GeneralLedgerEntryDto>>.Ok(await mediator.Send(new GetCashBookQuery(companyId, fromDate, toDate), ct)));
    [HttpGet("bank-book"), Authorize(Policy = AccountsPermissions.LedgerView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GeneralLedgerEntryDto>>>> BankBook([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<GeneralLedgerEntryDto>>.Ok(await mediator.Send(new GetBankBookQuery(companyId, fromDate, toDate), ct)));
    [HttpGet("daily-expense-report"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<FinancialStatementDto>>> DailyExpenseReport([FromQuery] Guid companyId, [FromQuery] DateOnly date, CancellationToken ct) => Ok(ApiResponse<FinancialStatementDto>.Ok(await mediator.Send(new GetDailyExpenseReportQuery(companyId, date), ct)));
    [HttpGet("monthly-expense-report"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<FinancialStatementDto>>> MonthlyExpenseReport([FromQuery] Guid companyId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct) => Ok(ApiResponse<FinancialStatementDto>.Ok(await mediator.Send(new GetMonthlyExpenseReportQuery(companyId, year, month), ct)));
    [HttpGet("trial-balance"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<FinancialStatementDto>>> TrialBalance([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) => Ok(ApiResponse<FinancialStatementDto>.Ok(await mediator.Send(new GetTrialBalanceQuery(companyId, fromDate, toDate), ct)));
    [HttpGet("profit-loss"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<FinancialStatementDto>>> ProfitLoss([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) => Ok(ApiResponse<FinancialStatementDto>.Ok(await mediator.Send(new GetProfitLossQuery(companyId, fromDate, toDate), ct)));
    [HttpGet("balance-sheet"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<FinancialStatementDto>>> BalanceSheet([FromQuery] Guid companyId, [FromQuery] DateOnly asOfDate, CancellationToken ct) => Ok(ApiResponse<FinancialStatementDto>.Ok(await mediator.Send(new GetBalanceSheetQuery(companyId, asOfDate), ct)));
    [HttpGet("cash-flow"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<FinancialStatementDto>>> CashFlow([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) => Ok(ApiResponse<FinancialStatementDto>.Ok(await mediator.Send(new GetCashFlowQuery(companyId, fromDate, toDate), ct)));
    [HttpGet("company-transfer-report"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CompanyMoneyTransferDto>>>> CompanyTransferReport([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CompanyMoneyTransferDto>>.Ok((await mediator.Send(new GetCompanyMoneyTransfersQuery(companyId, null), ct)).Where(x => (!fromDate.HasValue || x.TransferDate >= fromDate) && (!toDate.HasValue || x.TransferDate <= toDate)).ToList()));

    [HttpGet("trial-balance/export.csv"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> TrialBalanceCsv([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct)
    {
        var report = await mediator.Send(new GetTrialBalanceQuery(companyId, fromDate, toDate), ct);
        var csv = new StringBuilder("Code,Name,Debit,Credit,Balance\r\n");
        foreach (var line in report.Lines) csv.AppendLine($"{line.Code},{line.Name},{line.Debit},{line.Credit},{line.Balance}");
        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"trial-balance-{BusinessTime.Now:yyyyMMddHHmmss}.csv");
    }

    [HttpGet("trial-balance/export.xlsx"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> TrialBalanceExcel([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct)
    {
        var report = await mediator.Send(new GetTrialBalanceQuery(companyId, fromDate, toDate), ct);
        return await ExportFinancialAsync("Trial Balance", "Excel", report, ct);
    }

    [HttpGet("trial-balance/export.pdf"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> TrialBalancePdf([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct)
    {
        var report = await mediator.Send(new GetTrialBalanceQuery(companyId, fromDate, toDate), ct);
        return await ExportFinancialAsync("Trial Balance", "PDF", report, ct);
    }

    [HttpGet("ledger/export.xlsx"), Authorize(Policy = AccountsPermissions.LedgerView)]
    public async Task<IActionResult> LedgerExcel([FromQuery] Guid companyId, [FromQuery] Guid? accountId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        await ExportLedgerAsync("General Ledger", "Excel", await mediator.Send(new GetGeneralLedgerQuery(companyId, accountId, fromDate, toDate), ct), ct);

    [HttpGet("ledger/export.pdf"), Authorize(Policy = AccountsPermissions.LedgerView)]
    public async Task<IActionResult> LedgerPdf([FromQuery] Guid companyId, [FromQuery] Guid? accountId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        await ExportLedgerAsync("General Ledger", "PDF", await mediator.Send(new GetGeneralLedgerQuery(companyId, accountId, fromDate, toDate), ct), ct);

    [HttpGet("cash-book/export.xlsx"), Authorize(Policy = AccountsPermissions.LedgerView)]
    public async Task<IActionResult> CashBookExcel([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        await ExportLedgerAsync("Cash Book", "Excel", await mediator.Send(new GetCashBookQuery(companyId, fromDate, toDate), ct), ct);

    [HttpGet("cash-book/export.pdf"), Authorize(Policy = AccountsPermissions.LedgerView)]
    public async Task<IActionResult> CashBookPdf([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        await ExportLedgerAsync("Cash Book", "PDF", await mediator.Send(new GetCashBookQuery(companyId, fromDate, toDate), ct), ct);

    [HttpGet("bank-book/export.xlsx"), Authorize(Policy = AccountsPermissions.LedgerView)]
    public async Task<IActionResult> BankBookExcel([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        await ExportLedgerAsync("Bank Book", "Excel", await mediator.Send(new GetBankBookQuery(companyId, fromDate, toDate), ct), ct);

    [HttpGet("bank-book/export.pdf"), Authorize(Policy = AccountsPermissions.LedgerView)]
    public async Task<IActionResult> BankBookPdf([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        await ExportLedgerAsync("Bank Book", "PDF", await mediator.Send(new GetBankBookQuery(companyId, fromDate, toDate), ct), ct);

    [HttpGet("daily-expense-report/export.xlsx"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> DailyExpenseExcel([FromQuery] Guid companyId, [FromQuery] DateOnly date, CancellationToken ct) =>
        await ExportFinancialAsync("Daily Expense Report", "Excel", await mediator.Send(new GetDailyExpenseReportQuery(companyId, date), ct), ct);

    [HttpGet("daily-expense-report/export.pdf"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> DailyExpensePdf([FromQuery] Guid companyId, [FromQuery] DateOnly date, CancellationToken ct) =>
        await ExportFinancialAsync("Daily Expense Report", "PDF", await mediator.Send(new GetDailyExpenseReportQuery(companyId, date), ct), ct);

    [HttpGet("monthly-expense-report/export.xlsx"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> MonthlyExpenseExcel([FromQuery] Guid companyId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        await ExportFinancialAsync("Monthly Expense Report", "Excel", await mediator.Send(new GetMonthlyExpenseReportQuery(companyId, year, month), ct), ct);

    [HttpGet("monthly-expense-report/export.pdf"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> MonthlyExpensePdf([FromQuery] Guid companyId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        await ExportFinancialAsync("Monthly Expense Report", "PDF", await mediator.Send(new GetMonthlyExpenseReportQuery(companyId, year, month), ct), ct);

    [HttpGet("profit-loss/export.xlsx"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> ProfitLossExcel([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) =>
        await ExportFinancialAsync("Profit Loss", "Excel", await mediator.Send(new GetProfitLossQuery(companyId, fromDate, toDate), ct), ct);

    [HttpGet("profit-loss/export.pdf"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> ProfitLossPdf([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) =>
        await ExportFinancialAsync("Profit Loss", "PDF", await mediator.Send(new GetProfitLossQuery(companyId, fromDate, toDate), ct), ct);

    [HttpGet("balance-sheet/export.xlsx"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> BalanceSheetExcel([FromQuery] Guid companyId, [FromQuery] DateOnly asOfDate, CancellationToken ct) =>
        await ExportFinancialAsync("Balance Sheet", "Excel", await mediator.Send(new GetBalanceSheetQuery(companyId, asOfDate), ct), ct);

    [HttpGet("balance-sheet/export.pdf"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> BalanceSheetPdf([FromQuery] Guid companyId, [FromQuery] DateOnly asOfDate, CancellationToken ct) =>
        await ExportFinancialAsync("Balance Sheet", "PDF", await mediator.Send(new GetBalanceSheetQuery(companyId, asOfDate), ct), ct);

    [HttpGet("cash-flow/export.xlsx"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> CashFlowExcel([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) =>
        await ExportFinancialAsync("Cash Flow", "Excel", await mediator.Send(new GetCashFlowQuery(companyId, fromDate, toDate), ct), ct);

    [HttpGet("cash-flow/export.pdf"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> CashFlowPdf([FromQuery] Guid companyId, [FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate, CancellationToken ct) =>
        await ExportFinancialAsync("Cash Flow", "PDF", await mediator.Send(new GetCashFlowQuery(companyId, fromDate, toDate), ct), ct);

    [HttpGet("company-transfer-report/export.xlsx"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> CompanyTransferExcel([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        await ExportTransfersAsync("Company Transfer Report", "Excel", await mediator.Send(new GetCompanyMoneyTransfersQuery(companyId, null), ct), fromDate, toDate, ct);

    [HttpGet("company-transfer-report/export.pdf"), Authorize(Policy = AccountsPermissions.ReportView)]
    public async Task<IActionResult> CompanyTransferPdf([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        await ExportTransfersAsync("Company Transfer Report", "PDF", await mediator.Send(new GetCompanyMoneyTransfersQuery(companyId, null), ct), fromDate, toDate, ct);

    private async Task<IActionResult> ExportFinancialAsync(string title, string format, FinancialStatementDto report, CancellationToken ct)
    {
        var rows = report.Lines
            .Select(x => (IReadOnlyList<string>)[x.Code, x.Name, x.Debit.ToString("0.00"), x.Credit.ToString("0.00"), x.Balance.ToString("0.00")])
            .ToList();
        rows.Add(["TOTAL", "", report.TotalDebit.ToString("0.00"), report.TotalCredit.ToString("0.00"), report.NetAmount.ToString("0.00")]);
        return await ExportAsync(new ReportExportRequestDto(
            title,
            format,
            ["Code", "Name", "Debit", "Credit", "Balance"],
            rows,
            new Dictionary<string, string>
            {
                ["CompanyId"] = report.CompanyId.ToString(),
                ["FromDate"] = report.FromDate.ToString("yyyy-MM-dd"),
                ["ToDate"] = report.ToDate.ToString("yyyy-MM-dd"),
            }), ct);
    }

    private async Task<IActionResult> ExportLedgerAsync(string title, string format, IReadOnlyList<GeneralLedgerEntryDto> entries, CancellationToken ct)
    {
        var rows = entries
            .Select(x => (IReadOnlyList<string>)[x.TransactionDate.ToString("yyyy-MM-dd"), x.AccountId.ToString(), x.VoucherId.ToString(), x.ReferenceNo ?? "", x.DebitAmount.ToString("0.00"), x.CreditAmount.ToString("0.00"), x.BalanceAmount.ToString("0.00")])
            .ToList();
        return await ExportAsync(new ReportExportRequestDto(
            title,
            format,
            ["Date", "AccountId", "VoucherId", "ReferenceNo", "Debit", "Credit", "Balance"],
            rows), ct);
    }

    private async Task<IActionResult> ExportTransfersAsync(string title, string format, IReadOnlyList<CompanyMoneyTransferDto> transfers, DateOnly? fromDate, DateOnly? toDate, CancellationToken ct)
    {
        var filtered = transfers.Where(x => (!fromDate.HasValue || x.TransferDate >= fromDate) && (!toDate.HasValue || x.TransferDate <= toDate));
        var rows = filtered
            .Select(x => (IReadOnlyList<string>)[x.TransferDate.ToString("yyyy-MM-dd"), x.TransferNo, x.FromCompanyId.ToString(), x.ToCompanyId.ToString(), x.Amount.ToString("0.00"), x.TransferMethod, x.Status])
            .ToList();
        return await ExportAsync(new ReportExportRequestDto(
            title,
            format,
            ["Date", "TransferNo", "FromCompanyId", "ToCompanyId", "Amount", "Method", "Status"],
            rows), ct);
    }

    private async Task<IActionResult> ExportAsync(ReportExportRequestDto request, CancellationToken ct)
    {
        var file = await exporter.ExportAsync(request, Request.Headers.Authorization.ToString(), ct);
        return File(file.Content, file.ContentType, file.FileName);
    }

    private static byte[] CreateXlsx(FinancialStatementDto report)
    {
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, true))
        {
            AddZipEntry(archive, "[Content_Types].xml", """<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>""");
            AddZipEntry(archive, "_rels/.rels", """<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>""");
            AddZipEntry(archive, "xl/_rels/workbook.xml.rels", """<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>""");
            AddZipEntry(archive, "xl/workbook.xml", """<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Trial Balance" sheetId="1" r:id="rId1"/></sheets></workbook>""");
            AddZipEntry(archive, "xl/worksheets/sheet1.xml", BuildWorksheetXml(report));
        }
        return stream.ToArray();
    }

    private static string BuildWorksheetXml(FinancialStatementDto report)
    {
        var rows = new StringBuilder("""<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>""");
        rows.Append("<row r=\"1\"><c t=\"inlineStr\"><is><t>Code</t></is></c><c t=\"inlineStr\"><is><t>Name</t></is></c><c t=\"inlineStr\"><is><t>Debit</t></is></c><c t=\"inlineStr\"><is><t>Credit</t></is></c><c t=\"inlineStr\"><is><t>Balance</t></is></c></row>");
        var rowNumber = 2;
        foreach (var line in report.Lines)
        {
            rows.Append(CultureSafeRow(rowNumber++, line.Code, line.Name, line.Debit, line.Credit, line.Balance));
        }
        rows.Append("</sheetData></worksheet>");
        return rows.ToString();
    }

    private static string CultureSafeRow(int row, string code, string name, decimal debit, decimal credit, decimal balance) =>
        $"<row r=\"{row}\"><c t=\"inlineStr\"><is><t>{Xml(code)}</t></is></c><c t=\"inlineStr\"><is><t>{Xml(name)}</t></is></c><c><v>{debit}</v></c><c><v>{credit}</v></c><c><v>{balance}</v></c></row>";

    private static byte[] CreateSimplePdf(FinancialStatementDto report)
    {
        var text = new StringBuilder();
        text.AppendLine("Trial Balance");
        foreach (var line in report.Lines.Take(35))
        {
            text.AppendLine($"{line.Code} {line.Name} Dr:{line.Debit} Cr:{line.Credit} Bal:{line.Balance}");
        }

        var content = $"BT /F1 10 Tf 40 780 Td {string.Join(" T* ", text.ToString().Split(Environment.NewLine).Select(x => $"({Pdf(x)})"))} ET";
        var pdf = $"""
%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length {Encoding.ASCII.GetByteCount(content)} >> stream
{content}
endstream endobj
xref
0 6
0000000000 65535 f 
trailer << /Root 1 0 R /Size 6 >>
startxref
0
%%EOF
""";
        return Encoding.ASCII.GetBytes(pdf);
    }

    private static void AddZipEntry(ZipArchive archive, string name, string content)
    {
        var entry = archive.CreateEntry(name);
        using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
        writer.Write(content);
    }

    private static string Xml(string value) => System.Security.SecurityElement.Escape(value) ?? string.Empty;
    private static string Pdf(string value) => value.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
}
