namespace CompanyService.Application.Addresses;

public interface IAddressService
{
    // Country
    Task<IEnumerable<CountryDto>> GetCountriesAsync();
    Task<Guid> CreateCountryAsync(CountryDto dto);
    Task UpdateCountryAsync(CountryDto dto);
    Task DeleteCountryAsync(Guid id);

    // Division
    Task<IEnumerable<DivisionDto>> GetDivisionsAsync(Guid countryId);
    Task<Guid> CreateDivisionAsync(DivisionDto dto);
    Task UpdateDivisionAsync(DivisionDto dto);
    Task DeleteDivisionAsync(Guid id);

    // District
    Task<IEnumerable<DistrictDto>> GetDistrictsAsync(Guid divisionId);
    Task<Guid> CreateDistrictAsync(DistrictDto dto);
    Task UpdateDistrictAsync(DistrictDto dto);
    Task DeleteDistrictAsync(Guid id);

    // Upazila
    Task<IEnumerable<UpazilaDto>> GetUpazilasAsync(Guid districtId);
    Task<Guid> CreateUpazilaAsync(UpazilaDto dto);
    Task UpdateUpazilaAsync(UpazilaDto dto);
    Task DeleteUpazilaAsync(Guid id);

    // Post Office
    Task<IEnumerable<PostOfficeDto>> GetPostOfficesAsync(Guid upazilaId);
    Task<IEnumerable<AddressDirectoryRowDto>> GetBangladeshDirectoryAsync(string? search);
    Task<Guid> CreatePostOfficeAsync(PostOfficeDto dto);
    Task UpdatePostOfficeAsync(PostOfficeDto dto);
    Task DeletePostOfficeAsync(Guid id);

    // Area
    Task<IEnumerable<AreaDto>> GetAreasAsync(Guid postOfficeId);
    Task<Guid> CreateAreaAsync(AreaDto dto);
    Task UpdateAreaAsync(AreaDto dto);
    Task DeleteAreaAsync(Guid id);
}

public record CountryDto(Guid? Id, string NameEn, string NameBn, string Code);
public record DivisionDto(Guid? Id, Guid CountryId, string NameEn, string NameBn);
public record DistrictDto(Guid? Id, Guid DivisionId, string NameEn, string NameBn);
public record UpazilaDto(Guid? Id, Guid DistrictId, string NameEn, string NameBn);
public record PostOfficeDto(Guid? Id, Guid UpazilaId, string NameEn, string NameBn, string PostalCode);
public record AreaDto(Guid? Id, Guid PostOfficeId, string NameEn, string NameBn);
public record AddressDirectoryRowDto(
    Guid CountryId, string CountryNameEn, string CountryNameBn, string CountryCode,
    Guid DivisionId, string DivisionNameEn, string DivisionNameBn,
    Guid DistrictId, string DistrictNameEn, string DistrictNameBn,
    Guid UpazilaId, string UpazilaNameEn, string UpazilaNameBn,
    Guid PostOfficeId, string PostOfficeNameEn, string PostOfficeNameBn, string PostalCode);
