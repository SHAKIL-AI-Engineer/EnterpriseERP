using Microsoft.AspNetCore.Mvc;
using CompanyService.Application.Organogram;
using Erp.BuildingBlocks.CommonResponses;

namespace CompanyService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class OrganogramController(IOrganogramService organogramService) : ControllerBase
{
    // Departments
    [HttpGet("companies/{companyId}/departments")]
    public async Task<IActionResult> GetDepartments(Guid companyId)
    {
        var data = await organogramService.GetDepartmentsAsync(companyId);
        return Ok(ApiResponse<IEnumerable<DepartmentDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    /// <summary>Legacy/query list: GET .../Organogram/departments?companyId= (optional — all companies when omitted).</summary>
    [HttpGet("departments")]
    public async Task<IActionResult> ListDepartments([FromQuery] string? companyId, CancellationToken cancellationToken)
    {
        var companyGuid = OrganogramQueryHelpers.ParseOptionalCompanyId(companyId);
        if (companyGuid.HasValue)
        {
            var scoped = await organogramService.GetDepartmentsAsync(companyGuid.Value);
            return Ok(ApiResponse<IEnumerable<DepartmentDto>>.Ok(scoped, HttpContext.TraceIdentifier));
        }

        var all = await organogramService.GetAllDepartmentsAsync(cancellationToken);
        return Ok(ApiResponse<IEnumerable<DepartmentDto>>.Ok(all, HttpContext.TraceIdentifier));
    }

    [HttpPost("departments")]
    public async Task<IActionResult> CreateDepartment(DepartmentDto dto)
    {
        var id = await organogramService.CreateDepartmentAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("departments")]
    public async Task<IActionResult> UpdateDepartment(DepartmentDto dto)
    {
        await organogramService.UpdateDepartmentAsync(dto);
        return Ok(ApiResponse<string>.Ok("Department updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("departments/{id}")]
    public async Task<IActionResult> DeleteDepartment(Guid id)
    {
        await organogramService.DeleteDepartmentAsync(id);
        return Ok(ApiResponse<string>.Ok("Department deleted successfully", HttpContext.TraceIdentifier));
    }

    // Sections
    [HttpGet("departments/{departmentId}/sections")]
    public async Task<IActionResult> GetSections(Guid departmentId)
    {
        var data = await organogramService.GetSectionsAsync(departmentId);
        return Ok(ApiResponse<IEnumerable<SectionDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    /// <summary>Legacy/query list: GET .../Organogram/sections?departmentId= or ?companyId= (optional — all when both omitted).</summary>
    [HttpGet("sections")]
    public async Task<IActionResult> ListSections(
        [FromQuery] string? departmentId,
        [FromQuery] string? companyId,
        CancellationToken cancellationToken)
    {
        var deptId = OrganogramQueryHelpers.ParseOptionalCompanyId(departmentId);
        var companyGuid = OrganogramQueryHelpers.ParseOptionalCompanyId(companyId);
        if (deptId.HasValue)
        {
            var scoped = await organogramService.GetSectionsAsync(deptId.Value);
            return Ok(ApiResponse<IEnumerable<SectionDto>>.Ok(scoped, HttpContext.TraceIdentifier));
        }

        if (companyGuid.HasValue)
        {
            var byCompany = await organogramService.GetSectionsForCompanyAsync(companyGuid.Value, cancellationToken);
            return Ok(ApiResponse<IEnumerable<SectionDto>>.Ok(byCompany, HttpContext.TraceIdentifier));
        }

        var all = await organogramService.GetAllSectionsAsync(cancellationToken);
        return Ok(ApiResponse<IEnumerable<SectionDto>>.Ok(all, HttpContext.TraceIdentifier));
    }

    [HttpPost("sections")]
    public async Task<IActionResult> CreateSection(SectionDto dto)
    {
        var id = await organogramService.CreateSectionAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("sections")]
    public async Task<IActionResult> UpdateSection(SectionDto dto)
    {
        await organogramService.UpdateSectionAsync(dto);
        return Ok(ApiResponse<string>.Ok("Section updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("sections/{id}")]
    public async Task<IActionResult> DeleteSection(Guid id)
    {
        await organogramService.DeleteSectionAsync(id);
        return Ok(ApiResponse<string>.Ok("Section deleted successfully", HttpContext.TraceIdentifier));
    }

    // Designations
    [HttpGet("sections/{sectionId}/designations")]
    public async Task<IActionResult> GetDesignations(Guid sectionId)
    {
        var data = await organogramService.GetDesignationsAsync(sectionId);
        return Ok(ApiResponse<IEnumerable<DesignationDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("designations")]
    public async Task<IActionResult> CreateDesignation(DesignationDto dto)
    {
        var id = await organogramService.CreateDesignationAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("designations")]
    public async Task<IActionResult> UpdateDesignation(DesignationDto dto)
    {
        await organogramService.UpdateDesignationAsync(dto);
        return Ok(ApiResponse<string>.Ok("Designation updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("designations/{id}")]
    public async Task<IActionResult> DeleteDesignation(Guid id)
    {
        await organogramService.DeleteDesignationAsync(id);
        return Ok(ApiResponse<string>.Ok("Designation deleted successfully", HttpContext.TraceIdentifier));
    }

    // Lines
    [HttpGet("sections/{sectionId}/lines")]
    public async Task<IActionResult> GetLines(Guid sectionId)
    {
        var data = await organogramService.GetLinesAsync(sectionId);
        return Ok(ApiResponse<IEnumerable<LineDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("lines")]
    public async Task<IActionResult> CreateLine(LineDto dto)
    {
        var id = await organogramService.CreateLineAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("lines")]
    public async Task<IActionResult> UpdateLine(LineDto dto)
    {
        await organogramService.UpdateLineAsync(dto);
        return Ok(ApiResponse<string>.Ok("Line updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("lines/{id}")]
    public async Task<IActionResult> DeleteLine(Guid id)
    {
        await organogramService.DeleteLineAsync(id);
        return Ok(ApiResponse<string>.Ok("Line deleted successfully", HttpContext.TraceIdentifier));
    }

    // Groups
    [HttpGet("groups")]
    public async Task<IActionResult> GetGroups([FromQuery] string? companyId, CancellationToken cancellationToken)
    {
        var data = await organogramService.GetGroupsAsync(
            OrganogramQueryHelpers.ParseOptionalCompanyId(companyId),
            cancellationToken);
        return Ok(ApiResponse<IEnumerable<GroupDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("groups")]
    public async Task<IActionResult> CreateGroup(GroupDto dto)
    {
        var id = await organogramService.CreateGroupAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("groups")]
    public async Task<IActionResult> UpdateGroup(GroupDto dto)
    {
        await organogramService.UpdateGroupAsync(dto);
        return Ok(ApiResponse<string>.Ok("Group updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("groups/{id}")]
    public async Task<IActionResult> DeleteGroup(Guid id)
    {
        await organogramService.DeleteGroupAsync(id);
        return Ok(ApiResponse<string>.Ok("Group deleted successfully", HttpContext.TraceIdentifier));
    }

    // Floors
    [HttpGet("floors")]
    public async Task<IActionResult> GetFloors([FromQuery] string? companyId, CancellationToken cancellationToken)
    {
        var data = await organogramService.GetFloorsAsync(
            OrganogramQueryHelpers.ParseOptionalCompanyId(companyId),
            cancellationToken);
        return Ok(ApiResponse<IEnumerable<FloorDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("floors")]
    public async Task<IActionResult> CreateFloor(FloorDto dto)
    {
        var id = await organogramService.CreateFloorAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("floors")]
    public async Task<IActionResult> UpdateFloor(FloorDto dto)
    {
        await organogramService.UpdateFloorAsync(dto);
        return Ok(ApiResponse<string>.Ok("Floor updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("floors/{id}")]
    public async Task<IActionResult> DeleteFloor(Guid id)
    {
        await organogramService.DeleteFloorAsync(id);
        return Ok(ApiResponse<string>.Ok("Floor deleted successfully", HttpContext.TraceIdentifier));
    }
}
