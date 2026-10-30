using Microsoft.AspNetCore.Mvc;
using CompanyService.Application.Addresses;
using Erp.BuildingBlocks.CommonResponses;

namespace CompanyService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AddressesController(IAddressService addressService) : ControllerBase
{
    // Countries
    [HttpGet("countries")]
    public async Task<IActionResult> GetCountries()
    {
        var data = await addressService.GetCountriesAsync();
        return Ok(ApiResponse<IEnumerable<CountryDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("countries")]
    public async Task<IActionResult> CreateCountry(CountryDto dto)
    {
        var id = await addressService.CreateCountryAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("countries")]
    public async Task<IActionResult> UpdateCountry(CountryDto dto)
    {
        await addressService.UpdateCountryAsync(dto);
        return Ok(ApiResponse<string>.Ok("Country updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("countries/{id}")]
    public async Task<IActionResult> DeleteCountry(Guid id)
    {
        await addressService.DeleteCountryAsync(id);
        return Ok(ApiResponse<string>.Ok("Country deleted successfully", HttpContext.TraceIdentifier));
    }

    // Divisions
    [HttpGet("countries/{countryId}/divisions")]
    public async Task<IActionResult> GetDivisions(Guid countryId)
    {
        var data = await addressService.GetDivisionsAsync(countryId);
        return Ok(ApiResponse<IEnumerable<DivisionDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("divisions")]
    public async Task<IActionResult> CreateDivision(DivisionDto dto)
    {
        var id = await addressService.CreateDivisionAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("divisions")]
    public async Task<IActionResult> UpdateDivision(DivisionDto dto)
    {
        await addressService.UpdateDivisionAsync(dto);
        return Ok(ApiResponse<string>.Ok("Division updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("divisions/{id}")]
    public async Task<IActionResult> DeleteDivision(Guid id)
    {
        await addressService.DeleteDivisionAsync(id);
        return Ok(ApiResponse<string>.Ok("Division deleted successfully", HttpContext.TraceIdentifier));
    }

    // Districts
    [HttpGet("divisions/{divisionId}/districts")]
    public async Task<IActionResult> GetDistricts(Guid divisionId)
    {
        var data = await addressService.GetDistrictsAsync(divisionId);
        return Ok(ApiResponse<IEnumerable<DistrictDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("districts")]
    public async Task<IActionResult> CreateDistrict(DistrictDto dto)
    {
        var id = await addressService.CreateDistrictAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("districts")]
    public async Task<IActionResult> UpdateDistrict(DistrictDto dto)
    {
        await addressService.UpdateDistrictAsync(dto);
        return Ok(ApiResponse<string>.Ok("District updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("districts/{id}")]
    public async Task<IActionResult> DeleteDistrict(Guid id)
    {
        await addressService.DeleteDistrictAsync(id);
        return Ok(ApiResponse<string>.Ok("District deleted successfully", HttpContext.TraceIdentifier));
    }

    // Upazilas
    [HttpGet("districts/{districtId}/upazilas")]
    public async Task<IActionResult> GetUpazilas(Guid districtId)
    {
        var data = await addressService.GetUpazilasAsync(districtId);
        return Ok(ApiResponse<IEnumerable<UpazilaDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("upazilas")]
    public async Task<IActionResult> CreateUpazila(UpazilaDto dto)
    {
        var id = await addressService.CreateUpazilaAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("upazilas")]
    public async Task<IActionResult> UpdateUpazila(UpazilaDto dto)
    {
        await addressService.UpdateUpazilaAsync(dto);
        return Ok(ApiResponse<string>.Ok("Upazila updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("upazilas/{id}")]
    public async Task<IActionResult> DeleteUpazila(Guid id)
    {
        await addressService.DeleteUpazilaAsync(id);
        return Ok(ApiResponse<string>.Ok("Upazila deleted successfully", HttpContext.TraceIdentifier));
    }

    // Post Offices
    [HttpGet("upazilas/{upazilaId}/post-offices")]
    public async Task<IActionResult> GetPostOffices(Guid upazilaId)
    {
        var data = await addressService.GetPostOfficesAsync(upazilaId);
        return Ok(ApiResponse<IEnumerable<PostOfficeDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("bangladesh/directory")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AddressDirectoryRowDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBangladeshDirectory([FromQuery] string? search)
    {
        var data = await addressService.GetBangladeshDirectoryAsync(search);
        return Ok(ApiResponse<IEnumerable<AddressDirectoryRowDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("post-offices")]
    public async Task<IActionResult> CreatePostOffice(PostOfficeDto dto)
    {
        var id = await addressService.CreatePostOfficeAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("post-offices")]
    public async Task<IActionResult> UpdatePostOffice(PostOfficeDto dto)
    {
        await addressService.UpdatePostOfficeAsync(dto);
        return Ok(ApiResponse<string>.Ok("Post Office updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("post-offices/{id}")]
    public async Task<IActionResult> DeletePostOffice(Guid id)
    {
        await addressService.DeletePostOfficeAsync(id);
        return Ok(ApiResponse<string>.Ok("Post Office deleted successfully", HttpContext.TraceIdentifier));
    }

    // Areas
    [HttpGet("post-offices/{postOfficeId}/areas")]
    public async Task<IActionResult> GetAreas(Guid postOfficeId)
    {
        var data = await addressService.GetAreasAsync(postOfficeId);
        return Ok(ApiResponse<IEnumerable<AreaDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("areas")]
    public async Task<IActionResult> CreateArea(AreaDto dto)
    {
        var id = await addressService.CreateAreaAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("areas")]
    public async Task<IActionResult> UpdateArea(AreaDto dto)
    {
        await addressService.UpdateAreaAsync(dto);
        return Ok(ApiResponse<string>.Ok("Area updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("areas/{id}")]
    public async Task<IActionResult> DeleteArea(Guid id)
    {
        await addressService.DeleteAreaAsync(id);
        return Ok(ApiResponse<string>.Ok("Area deleted successfully", HttpContext.TraceIdentifier));
    }
}
