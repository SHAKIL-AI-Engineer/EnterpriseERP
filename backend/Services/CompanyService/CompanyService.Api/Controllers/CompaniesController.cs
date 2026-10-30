using Erp.BuildingBlocks.CommonResponses;
using Erp.BuildingBlocks.CommonSecurity;
using Erp.BuildingBlocks.Contracts.Pagination;
using CompanyService.Application.Companies;
using CompanyService.Api.Helpers;
using CompanyService.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CompanyService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class CompaniesController(
    ICompanyReadService companyRead,
    ICompanyService companyService,
    ITenantContext tenant) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission:company.read")]
    public async Task<ActionResult<ApiResponse<PagedResult<CompanySummaryDto>>>> List(
        [FromQuery] PagedRequest request,
        CancellationToken cancellationToken)
    {
        PagedResult<CompanySummaryDto> data;
        if (tenant.IsSuperAdmin)
        {
            data = await companyRead.ListAsync(request, cancellationToken);
        }
        else
        {
            data = await companyRead.ListForCompaniesAsync(request, tenant.AllowedCompanyIds, cancellationToken);
        }

        return Ok(ApiResponse<PagedResult<CompanySummaryDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("mine")]
    [Authorize(Policy = "Permission:company.read")]
    public async Task<ActionResult<ApiResponse<PagedResult<CompanySummaryDto>>>> ListMine(
        [FromQuery] PagedRequest request,
        CancellationToken cancellationToken)
    {
        if (tenant.IsSuperAdmin)
        {
            var all = await companyRead.ListAsync(request, cancellationToken);
            return Ok(ApiResponse<PagedResult<CompanySummaryDto>>.Ok(all, HttpContext.TraceIdentifier));
        }

        var data = await companyRead.ListForCompaniesAsync(request, tenant.AllowedCompanyIds, cancellationToken);
        return Ok(ApiResponse<PagedResult<CompanySummaryDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "Permission:company.read")]
    public async Task<ActionResult<ApiResponse<CompanyDetailsDto>>> Get(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!tenant.HasAccessToCompany(id))
        {
            return Forbid();
        }

        var data = await companyService.GetByIdAsync(id, cancellationToken);
        if (data == null)
        {
            return NotFound(ApiResponse<CompanyDetailsDto>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("NotFound", "Company not found")]));
        }
        return Ok(ApiResponse<CompanyDetailsDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(
        [FromForm] CreateCompanyFormRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var logo = await CompanyFormFileHelper.ToPayloadAsync(request.Logo, cancellationToken);
            var signature = await CompanyFormFileHelper.ToPayloadAsync(request.AuthorizeSignature, cancellationToken);
            var dto = ToCreateDto(request);
            var id = await companyService.CreateAsync(dto, logo, signature, cancellationToken);
            return CreatedAtAction(nameof(Get), new { id }, ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<Guid>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("Validation", ex.Message)]));
        }
    }

    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<string>>> Update(
        Guid id,
        [FromForm] UpdateCompanyFormRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var logo = await CompanyFormFileHelper.ToPayloadAsync(request.Logo, cancellationToken);
            var signature = await CompanyFormFileHelper.ToPayloadAsync(request.AuthorizeSignature, cancellationToken);
            var dto = ToUpdateDto(request);
            await companyService.UpdateAsync(id, dto, logo, signature, cancellationToken);
            return Ok(ApiResponse<string>.Ok("Company updated successfully", HttpContext.TraceIdentifier));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<string>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("Validation", ex.Message)]));
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await companyService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Company deleted successfully", HttpContext.TraceIdentifier));
    }

    private static CreateCompanyDto ToCreateDto(CreateCompanyFormRequest request) => new()
    {
        CompanyNameEn = request.CompanyNameEn,
        CompanyNameBn = request.CompanyNameBn,
        AddressEn = request.AddressEn,
        AddressBn = request.AddressBn,
        Email = request.Email,
        Phone = request.Phone,
        TradeLicenseNo = request.TradeLicenseNo,
        Industry = request.Industry,
        FoundedYear = request.FoundedYear,
        Status = request.Status,
    };

    private static UpdateCompanyDto ToUpdateDto(UpdateCompanyFormRequest request) => new()
    {
        CompanyNameEn = request.CompanyNameEn,
        CompanyNameBn = request.CompanyNameBn,
        AddressEn = request.AddressEn,
        AddressBn = request.AddressBn,
        Email = request.Email,
        Phone = request.Phone,
        TradeLicenseNo = request.TradeLicenseNo,
        Industry = request.Industry,
        FoundedYear = request.FoundedYear,
        Status = request.Status,
    };
}
