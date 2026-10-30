using Erp.BuildingBlocks.CommonResponses;
using Erp.BuildingBlocks.CommonSecurity;
using Erp.BuildingBlocks.Contracts.Pagination;
using HRService.Application.Employees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRService.Api.Controllers;

[ApiController]
[Route("api/v1/hr/[controller]")]
[Authorize]
public sealed class EmployeesController(
    IEmployeeReadService employees,
    IEmployeeService employeeService,
    IEmployeeImportService employeeImport,
    IEmployeeExcelImportService employeeExcelImport,
    ITenantContext tenant) : ControllerBase
{
    public sealed class EmployeeBatchRequest
    {
        public IReadOnlyList<Guid> Ids { get; init; } = [];
    }

    [HttpGet]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<PaginatedApiResponse<EmployeeListItemDto>>> List(
        [FromQuery] EmployeeListQuery query,
        CancellationToken cancellationToken)
    {
        query.CompanyId = TenantCompanyResolver.ResolveCompanyId(tenant, query.CompanyId);
        var result = await employees.ListAsync(query, cancellationToken);
        return Ok(PaginatedApiResponse<EmployeeListItemDto>.Ok(
            result.Data,
            result.Pagination,
            "Data loaded successfully",
            HttpContext.TraceIdentifier));
    }

    [HttpPost("batch")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmployeeListItemDto>>>> Batch(
        [FromBody] EmployeeBatchRequest request,
        CancellationToken cancellationToken)
    {
        var ids = request.Ids?.Where(x => x != Guid.Empty).Distinct().ToArray() ?? [];
        if (ids.Length == 0)
            return Ok(ApiResponse<IReadOnlyList<EmployeeListItemDto>>.Ok([], HttpContext.TraceIdentifier));

        var items = await employees.ListByIdsAsync(ids, cancellationToken);
        var allowed = items.Where(e => tenant.HasAccessToCompany(e.CompanyId)).ToList();
        return Ok(ApiResponse<IReadOnlyList<EmployeeListItemDto>>.Ok(allowed, HttpContext.TraceIdentifier));
    }

    [HttpPost("lookup")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmployeeLookupDto>>>> Lookup(
        [FromBody] EmployeeBatchRequest request,
        CancellationToken cancellationToken)
    {
        var ids = request.Ids?.Where(x => x != Guid.Empty).Distinct().ToArray() ?? [];
        if (ids.Length == 0)
            return Ok(ApiResponse<IReadOnlyList<EmployeeLookupDto>>.Ok([], HttpContext.TraceIdentifier));

        Guid? companyId = null;
        if (!tenant.IsSuperAdmin && tenant.ActiveCompanyId.HasValue)
            companyId = tenant.ActiveCompanyId;

        var items = await employees.ListLookupsByIdsAsync(ids, companyId, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<EmployeeLookupDto>>.Ok(items, HttpContext.TraceIdentifier));
    }

    [HttpGet("manpower")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<PaginatedApiResponse<ManpowerListItemDto>>> ManpowerList(
        [FromQuery] ManpowerListQuery query,
        CancellationToken cancellationToken)
    {
        query.CompanyId = TenantCompanyResolver.ResolveCompanyId(tenant, query.CompanyId);
        var result = await employees.ManpowerListAsync(query, cancellationToken);
        return Ok(PaginatedApiResponse<ManpowerListItemDto>.Ok(
            result.Data,
            result.Pagination,
            "Data loaded successfully",
            HttpContext.TraceIdentifier));
    }

    [HttpGet("manpower/summary")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<ApiResponse<ManpowerSummaryDto>>> ManpowerSummary(
        [FromQuery] ManpowerSummaryQuery query,
        CancellationToken cancellationToken)
    {
        query.CompanyId = TenantCompanyResolver.ResolveCompanyId(tenant, query.CompanyId);
        var data = await employees.ManpowerSummaryAsync(query, cancellationToken);
        return Ok(ApiResponse<ManpowerSummaryDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("transfers")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<PaginatedApiResponse<EmployeeTransferDto>>> ListTransfers(
        [FromQuery] EmployeeTransferListQuery query,
        CancellationToken cancellationToken)
    {
        query.CompanyId = TenantCompanyResolver.ResolveCompanyId(tenant, query.CompanyId);
        var result = await employees.ListTransfersAsync(query, cancellationToken);
        return Ok(PaginatedApiResponse<EmployeeTransferDto>.Ok(
            result.Data,
            result.Pagination,
            "Data loaded successfully",
            HttpContext.TraceIdentifier));
    }

    [HttpPut("addresses/{addressId:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateAddress(Guid addressId, [FromBody] EmployeeAddressDto dto)
    {
        await employeeService.UpdateAddressAsync(addressId, dto);
        return Ok(ApiResponse<string>.Ok("Address updated", HttpContext.TraceIdentifier));
    }

    [HttpDelete("addresses/{addressId:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteAddress(Guid addressId)
    {
        await employeeService.DeleteAddressAsync(addressId);
        return Ok(ApiResponse<string>.Ok("Address deleted", HttpContext.TraceIdentifier));
    }

    [HttpPut("bank-accounts/{accountId:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateBankAccount(Guid accountId, [FromBody] EmployeeBankAccountDto dto)
    {
        await employeeService.UpdateBankAccountAsync(accountId, dto);
        return Ok(ApiResponse<string>.Ok("Bank account updated", HttpContext.TraceIdentifier));
    }

    [HttpDelete("bank-accounts/{accountId:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteBankAccount(Guid accountId)
    {
        await employeeService.DeleteBankAccountAsync(accountId);
        return Ok(ApiResponse<string>.Ok("Bank account deleted", HttpContext.TraceIdentifier));
    }

    [HttpPut("emergency-contacts/{contactId:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateEmergencyContact(Guid contactId, [FromBody] EmergencyContactDto dto)
    {
        await employeeService.UpdateEmergencyContactAsync(contactId, dto);
        return Ok(ApiResponse<string>.Ok("Emergency contact updated", HttpContext.TraceIdentifier));
    }

    [HttpDelete("emergency-contacts/{contactId:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteEmergencyContact(Guid contactId)
    {
        await employeeService.DeleteEmergencyContactAsync(contactId);
        return Ok(ApiResponse<string>.Ok("Emergency contact deleted", HttpContext.TraceIdentifier));
    }

    [HttpDelete("documents/{documentId:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteDocument(Guid documentId)
    {
        await employeeService.DeleteDocumentAsync(documentId);
        return Ok(ApiResponse<string>.Ok("Document deleted", HttpContext.TraceIdentifier));
    }

    [HttpGet("export")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmployeeImportRowDto>>>> Export(
        [FromQuery] Guid? companyId,
        CancellationToken cancellationToken)
    {
        try
        {
            var resolved = TenantCompanyResolver.ResolveCompanyId(tenant, companyId);
            var data = await employeeImport.ExportAsync(resolved, cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<EmployeeImportRowDto>>.Ok(data, HttpContext.TraceIdentifier));
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(ApiResponse<IReadOnlyList<EmployeeImportRowDto>>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("COMPANY", ex.Message)]));
        }
    }

    [HttpPost("excel-import/preview")]
    [Authorize(Policy = "Permission:hr.employees.write")]
    public async Task<ActionResult<ApiResponse<EmployeeExcelImportPreviewResult>>> ExcelImportPreview(
        IFormFile file,
        [FromQuery] Guid? companyId,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<EmployeeExcelImportPreviewResult>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("FILE", "Excel file is required.")]));
        }

        try
        {
            var resolved = TenantCompanyResolver.ResolveCompanyId(tenant, companyId);
            await using var stream = file.OpenReadStream();
            var data = await employeeExcelImport.PreviewAsync(resolved, stream, cancellationToken);
            return Ok(ApiResponse<EmployeeExcelImportPreviewResult>.Ok(data, HttpContext.TraceIdentifier));
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(ApiResponse<EmployeeExcelImportPreviewResult>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("COMPANY", ex.Message)]));
        }
    }

    [HttpPost("excel-import/confirm")]
    [Authorize(Policy = "Permission:hr.employees.write")]
    public async Task<ActionResult<ApiResponse<EmployeeExcelImportConfirmResult>>> ExcelImportConfirm(
        [FromBody] EmployeeExcelImportConfirmRequest request,
        [FromQuery] Guid? companyId,
        CancellationToken cancellationToken)
    {
        try
        {
            var resolved = TenantCompanyResolver.ResolveCompanyId(tenant, companyId);
            var data = await employeeExcelImport.ConfirmAsync(resolved, request.SessionId, cancellationToken);
            return Ok(ApiResponse<EmployeeExcelImportConfirmResult>.Ok(data, HttpContext.TraceIdentifier));
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(ApiResponse<EmployeeExcelImportConfirmResult>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("COMPANY", ex.Message)]));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<EmployeeExcelImportConfirmResult>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("SESSION", ex.Message)]));
        }
    }

    [HttpPost("import-upsert")]
    [Authorize(Policy = "Permission:hr.employees.write")]
    public async Task<ActionResult<ApiResponse<EmployeeImportUpsertResult>>> ImportUpsert(
        [FromBody] EmployeeImportUpsertRequest request,
        [FromQuery] Guid? companyId,
        CancellationToken cancellationToken)
    {
        try
        {
            var resolved = TenantCompanyResolver.ResolveCompanyId(tenant, companyId);
            var result = await employeeImport.UpsertAsync(resolved, request, cancellationToken);
            return Ok(ApiResponse<EmployeeImportUpsertResult>.Ok(result, HttpContext.TraceIdentifier));
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(ApiResponse<EmployeeImportUpsertResult>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("COMPANY", ex.Message)]));
        }
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<ApiResponse<EmployeeDetailsDto>>> Get(
        Guid id,
        CancellationToken cancellationToken)
    {
        var data = await employees.GetByIdAsync(id, cancellationToken);
        if (data == null)
        {
            return NotFound(ApiResponse<EmployeeDetailsDto>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("NotFound", "Employee not found")]));
        }

        if (!tenant.HasAccessToCompany(data.CompanyId))
        {
            return Forbid();
        }

        return Ok(ApiResponse<EmployeeDetailsDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}/status-history")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmployeeStatusHistoryDto>>>> StatusHistory(
        Guid id,
        CancellationToken cancellationToken)
    {
        var data = await employees.GetStatusHistoryAsync(id, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<EmployeeStatusHistoryDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}/transfers")]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmployeeTransferDto>>>> EmployeeTransfers(
        Guid id,
        CancellationToken cancellationToken)
    {
        var data = await employees.GetEmployeeTransfersAsync(id, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<EmployeeTransferDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(
        [FromBody] CreateEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        var id = await employeeService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id }, ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> Update(
        Guid id,
        [FromBody] UpdateEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        await employeeService.UpdateAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Employee updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await employeeService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Employee deleted successfully", HttpContext.TraceIdentifier));
    }

    // Advanced Operations

    [HttpPost("{id:guid}/transfer")]
    public async Task<ActionResult<ApiResponse<string>>> Transfer(
        Guid id,
        [FromBody] TransferEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        await employeeService.TransferAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Employee transfer processed", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<string>>> ChangeStatus(
        Guid id,
        [FromBody] ChangeStatusDto dto,
        CancellationToken cancellationToken)
    {
        await employeeService.ChangeStatusAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok($"Employee status changed to {dto.Status}", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/salary")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateSalary(
        Guid id,
        [FromBody] UpdateSalaryDto dto,
        CancellationToken cancellationToken)
    {
        await employeeService.UpdateSalaryAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Employee salary updated", HttpContext.TraceIdentifier));
    }

    // Sub-Resources (Addresses, Bank, Contacts, Docs)

    [HttpPost("{id:guid}/addresses")]
    public async Task<ActionResult<ApiResponse<string>>> AddAddress(Guid id, [FromBody] EmployeeAddressDto dto)
    {
        await employeeService.AddAddressAsync(id, dto);
        return Ok(ApiResponse<string>.Ok("Address added", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/bank-accounts")]
    public async Task<ActionResult<ApiResponse<string>>> AddBankAccount(Guid id, [FromBody] EmployeeBankAccountDto dto)
    {
        await employeeService.AddBankAccountAsync(id, dto);
        return Ok(ApiResponse<string>.Ok("Bank account added", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/emergency-contacts")]
    public async Task<ActionResult<ApiResponse<string>>> AddEmergencyContact(Guid id, [FromBody] EmergencyContactDto dto)
    {
        await employeeService.AddEmergencyContactAsync(id, dto);
        return Ok(ApiResponse<string>.Ok("Emergency contact added", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/documents")]
    public async Task<ActionResult<ApiResponse<string>>> AddDocument(Guid id, [FromBody] EmployeeDocumentDto dto)
    {
        await employeeService.AddDocumentAsync(id, dto);
        return Ok(ApiResponse<string>.Ok("Document added", HttpContext.TraceIdentifier));
    }
}
