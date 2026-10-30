using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/master/colors")]
public sealed class MasterColorsController(IMediator mediator) : ControllerBase
{
    [HttpGet("template")]
    [Authorize]
    public async Task<IActionResult> GetTemplate(CancellationToken cancellationToken)
    {
        var bytes = await mediator.Send(new GetColorImportTemplateQuery(), cancellationToken);
        return File(bytes, "text/csv", "color-import-template.csv");
    }

    [HttpPost("import")]
    [Authorize(Policy = MerchandisingPolicies.MasterManage)]
    public async Task<ActionResult<ApiResponse<ColorImportResultDto>>> Import([FromQuery] Guid companyId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return BadRequest(ApiResponse<ColorImportResultDto>.Fail("Uploaded file is empty."));
        }

        await using var stream = file.OpenReadStream();
        var result = await mediator.Send(new ImportColorsCommand(companyId, stream), cancellationToken);
        return Ok(ApiResponse<ColorImportResultDto>.Ok(result, "Colors imported."));
    }
}
