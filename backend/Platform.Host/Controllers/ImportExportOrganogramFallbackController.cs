using EnterpriseERP.Platform.Host.ImportExport;

using Erp.BuildingBlocks.CommonResponses;

using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;



namespace EnterpriseERP.Platform.Host.Controllers;



/// <summary>

/// Company organogram import/export when ImportExportService (Go :8060) is not running.

/// </summary>

[ApiController]

[Route("api/v1/import-export/company-organogram")]

[Authorize]

public sealed class ImportExportOrganogramFallbackController(

    CompanyOrganogramImportService importService) : ControllerBase

{

    private const string FileName = "company-organogram-import-demo.xlsx";

    private static readonly string TemplatePath = Path.Combine(AppContext.BaseDirectory, "Templates", FileName);



    [HttpGet("demo-format")]

    [Produces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]

    public IActionResult DownloadDemoFormat()

    {

        if (!System.IO.File.Exists(TemplatePath))

        {

            return StatusCode(StatusCodes.Status503ServiceUnavailable,

                new { success = false, message = "Organogram demo template file is missing on the server." });

        }



        return PhysicalFile(

            TemplatePath,

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

            FileName);

    }



    [HttpPost("import")]

    [RequestSizeLimit(20 * 1024 * 1024)]

    [ProducesResponseType(typeof(ApiResponse<CompanyOrganogramImportResult>), StatusCodes.Status200OK)]

    public async Task<IActionResult> Import(IFormFile? file, CancellationToken cancellationToken)

    {

        if (file is null || file.Length == 0)

        {

            return BadRequest(ApiResponse<CompanyOrganogramImportResult>.Fail(

                HttpContext.TraceIdentifier,

                [new ApiError("FILE", "file is required")]));

        }



        var ext = Path.GetExtension(file.FileName);

        if (!string.Equals(ext, ".xlsx", StringComparison.OrdinalIgnoreCase)

            && !string.Equals(ext, ".xls", StringComparison.OrdinalIgnoreCase))

        {

            return BadRequest(ApiResponse<CompanyOrganogramImportResult>.Fail(

                HttpContext.TraceIdentifier,

                [new ApiError("FILE", "only Excel (.xlsx) files are supported")]));

        }



        await using var stream = file.OpenReadStream();

        var result = await importService.ImportAsync(stream, cancellationToken);

        return Ok(ApiResponse<CompanyOrganogramImportResult>.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpGet("export")]
    [Produces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]
    public async Task<IActionResult> Export([FromQuery] string? companyName, CancellationToken cancellationToken)
    {
        var bytes = await importService.ExportAsync(companyName, cancellationToken);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "company-organogram-export.xlsx");
    }
}

