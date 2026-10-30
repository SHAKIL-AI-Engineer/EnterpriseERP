using EnterpriseERP.Platform.Host.ImportExport;
using Erp.BuildingBlocks.CommonResponses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnterpriseERP.Platform.Host.Controllers;

[ApiController]
[Route("api/v1/import-export/address")]
[Authorize]
public sealed class ImportExportAddressFallbackController(AddressImportService importService) : ControllerBase
{
    [HttpGet("demo-format")]
    [Produces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]
    public IActionResult DownloadDemoFormat()
    {
        var bytes = AddressExcelParser.BuildDemoWorkbook();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "address-import-demo.xlsx");
    }

    [HttpPost("import")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    [ProducesResponseType(typeof(ApiResponse<AddressImportResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Import(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<AddressImportResult>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("FILE", "file is required")]));
        }

        await using var stream = file.OpenReadStream();
        var result = await importService.ImportAsync(stream, cancellationToken);
        return Ok(ApiResponse<AddressImportResult>.Ok(result, HttpContext.TraceIdentifier));
    }
}
