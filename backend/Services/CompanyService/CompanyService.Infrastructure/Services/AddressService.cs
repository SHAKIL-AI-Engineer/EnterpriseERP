using CompanyService.Application.Addresses;
using CompanyService.Domain.Entities;
using CompanyService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CompanyService.Infrastructure.Services;

public sealed class AddressService(CompanyDbContext db) : IAddressService
{
    // Country
    public async Task<IEnumerable<CountryDto>> GetCountriesAsync() =>
        await db.Countries.AsNoTracking()
            .Select(x => new CountryDto(x.Id, x.NameEn, x.NameBn, x.Code))
            .ToListAsync();

    public async Task<Guid> CreateCountryAsync(CountryDto dto)
    {
        var country = new Country { Id = Guid.NewGuid(), NameEn = dto.NameEn, NameBn = dto.NameBn, Code = dto.Code };
        db.Countries.Add(country);
        await db.SaveChangesAsync();
        return country.Id;
    }

    public async Task UpdateCountryAsync(CountryDto dto)
    {
        var country = await db.Countries.FindAsync(dto.Id);
        if (country == null) return;

        country.NameEn = dto.NameEn;
        country.NameBn = dto.NameBn;
        country.Code = dto.Code;

        await db.SaveChangesAsync();
    }

    public async Task DeleteCountryAsync(Guid id)
    {
        var country = await db.Countries.FindAsync(id);
        if (country == null) return;

        db.Countries.Remove(country);
        await db.SaveChangesAsync();
    }

    // Division
    public async Task<IEnumerable<DivisionDto>> GetDivisionsAsync(Guid countryId) =>
        await db.Divisions.AsNoTracking().Where(x => x.CountryId == countryId)
            .Select(x => new DivisionDto(x.Id, x.CountryId, x.NameEn, x.NameBn))
            .ToListAsync();

    public async Task<Guid> CreateDivisionAsync(DivisionDto dto)
    {
        var division = new Division { Id = Guid.NewGuid(), CountryId = dto.CountryId, NameEn = dto.NameEn, NameBn = dto.NameBn };
        db.Divisions.Add(division);
        await db.SaveChangesAsync();
        return division.Id;
    }

    public async Task UpdateDivisionAsync(DivisionDto dto)
    {
        var division = await db.Divisions.FindAsync(dto.Id);
        if (division == null) return;

        division.NameEn = dto.NameEn;
        division.NameBn = dto.NameBn;

        await db.SaveChangesAsync();
    }

    public async Task DeleteDivisionAsync(Guid id)
    {
        var division = await db.Divisions.FindAsync(id);
        if (division == null) return;

        db.Divisions.Remove(division);
        await db.SaveChangesAsync();
    }

    // District
    public async Task<IEnumerable<DistrictDto>> GetDistrictsAsync(Guid divisionId) =>
        await db.Districts.AsNoTracking().Where(x => x.DivisionId == divisionId)
            .Select(x => new DistrictDto(x.Id, x.DivisionId, x.NameEn, x.NameBn))
            .ToListAsync();

    public async Task<Guid> CreateDistrictAsync(DistrictDto dto)
    {
        var district = new District { Id = Guid.NewGuid(), DivisionId = dto.DivisionId, NameEn = dto.NameEn, NameBn = dto.NameBn };
        db.Districts.Add(district);
        await db.SaveChangesAsync();
        return district.Id;
    }

    public async Task UpdateDistrictAsync(DistrictDto dto)
    {
        var district = await db.Districts.FindAsync(dto.Id);
        if (district == null) return;

        district.NameEn = dto.NameEn;
        district.NameBn = dto.NameBn;

        await db.SaveChangesAsync();
    }

    public async Task DeleteDistrictAsync(Guid id)
    {
        var district = await db.Districts.FindAsync(id);
        if (district == null) return;

        db.Districts.Remove(district);
        await db.SaveChangesAsync();
    }

    // Upazila
    public async Task<IEnumerable<UpazilaDto>> GetUpazilasAsync(Guid districtId) =>
        await db.Upazilas.AsNoTracking().Where(x => x.DistrictId == districtId)
            .Select(x => new UpazilaDto(x.Id, x.DistrictId, x.NameEn, x.NameBn))
            .ToListAsync();

    public async Task<Guid> CreateUpazilaAsync(UpazilaDto dto)
    {
        var upazila = new Upazila { Id = Guid.NewGuid(), DistrictId = dto.DistrictId, NameEn = dto.NameEn, NameBn = dto.NameBn };
        db.Upazilas.Add(upazila);
        await db.SaveChangesAsync();
        return upazila.Id;
    }

    public async Task UpdateUpazilaAsync(UpazilaDto dto)
    {
        var upazila = await db.Upazilas.FindAsync(dto.Id);
        if (upazila == null) return;

        upazila.NameEn = dto.NameEn;
        upazila.NameBn = dto.NameBn;

        await db.SaveChangesAsync();
    }

    public async Task DeleteUpazilaAsync(Guid id)
    {
        var upazila = await db.Upazilas.FindAsync(id);
        if (upazila == null) return;

        db.Upazilas.Remove(upazila);
        await db.SaveChangesAsync();
    }

    // Post Office
    public async Task<IEnumerable<PostOfficeDto>> GetPostOfficesAsync(Guid upazilaId) =>
        await db.PostOffices.AsNoTracking().Where(x => x.UpazilaId == upazilaId)
            .Select(x => new PostOfficeDto(x.Id, x.UpazilaId, x.NameEn, x.NameBn, x.PostalCode))
            .ToListAsync();

    public async Task<IEnumerable<AddressDirectoryRowDto>> GetBangladeshDirectoryAsync(string? search)
    {
        var query = db.PostOffices.AsNoTracking()
            .Where(x => x.IsActive && x.Upazila != null
                && x.Upazila.District != null
                && x.Upazila.District.Division != null
                && x.Upazila.District.Division.Country != null
                && x.Upazila.District.Division.Country.Code == "BD");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x =>
                x.PostalCode.Contains(term)
                || x.Upazila!.District!.Division!.Country!.NameEn.Contains(term)
                || x.Upazila.District.Division.Country.NameBn.Contains(term)
                || x.Upazila.District.Division.NameEn.Contains(term)
                || x.Upazila.District.Division.NameBn.Contains(term)
                || x.Upazila.District.NameEn.Contains(term)
                || x.Upazila.District.NameBn.Contains(term)
                || x.Upazila.NameEn.Contains(term)
                || x.Upazila.NameBn.Contains(term)
                || x.NameEn.Contains(term)
                || x.NameBn.Contains(term));
        }

        return await query
            .OrderBy(x => x.Upazila!.District!.Division!.NameEn)
            .ThenBy(x => x.Upazila!.District!.NameEn)
            .ThenBy(x => x.Upazila!.NameEn)
            .ThenBy(x => x.PostalCode)
            .ThenBy(x => x.NameEn)
            .Select(x => new AddressDirectoryRowDto(
                x.Upazila!.District!.Division!.Country!.Id,
                x.Upazila.District.Division.Country.NameEn,
                x.Upazila.District.Division.Country.NameBn,
                x.Upazila.District.Division.Country.Code,
                x.Upazila.District.Division.Id,
                x.Upazila.District.Division.NameEn,
                x.Upazila.District.Division.NameBn,
                x.Upazila.District.Id,
                x.Upazila.District.NameEn,
                x.Upazila.District.NameBn,
                x.Upazila.Id,
                x.Upazila.NameEn,
                x.Upazila.NameBn,
                x.Id,
                x.NameEn,
                x.NameBn,
                x.PostalCode))
            .ToListAsync();
    }

    public async Task<Guid> CreatePostOfficeAsync(PostOfficeDto dto)
    {
        var po = new PostOffice { Id = Guid.NewGuid(), UpazilaId = dto.UpazilaId, NameEn = dto.NameEn, NameBn = dto.NameBn, PostalCode = dto.PostalCode };
        db.PostOffices.Add(po);
        await db.SaveChangesAsync();
        return po.Id;
    }

    public async Task UpdatePostOfficeAsync(PostOfficeDto dto)
    {
        var po = await db.PostOffices.FindAsync(dto.Id);
        if (po == null) return;

        po.NameEn = dto.NameEn;
        po.NameBn = dto.NameBn;
        po.PostalCode = dto.PostalCode;

        await db.SaveChangesAsync();
    }

    public async Task DeletePostOfficeAsync(Guid id)
    {
        var po = await db.PostOffices.FindAsync(id);
        if (po == null) return;

        db.PostOffices.Remove(po);
        await db.SaveChangesAsync();
    }

    // Area
    public async Task<IEnumerable<AreaDto>> GetAreasAsync(Guid postOfficeId) =>
        await db.Areas.AsNoTracking().Where(x => x.PostOfficeId == postOfficeId)
            .Select(x => new AreaDto(x.Id, x.PostOfficeId, x.NameEn, x.NameBn))
            .ToListAsync();

    public async Task<Guid> CreateAreaAsync(AreaDto dto)
    {
        var area = new Area { Id = Guid.NewGuid(), PostOfficeId = dto.PostOfficeId, NameEn = dto.NameEn, NameBn = dto.NameBn };
        db.Areas.Add(area);
        await db.SaveChangesAsync();
        return area.Id;
    }

    public async Task UpdateAreaAsync(AreaDto dto)
    {
        var area = await db.Areas.FindAsync(dto.Id);
        if (area == null) return;

        area.NameEn = dto.NameEn;
        area.NameBn = dto.NameBn;

        await db.SaveChangesAsync();
    }

    public async Task DeleteAreaAsync(Guid id)
    {
        var area = await db.Areas.FindAsync(id);
        if (area == null) return;

        db.Areas.Remove(area);
        await db.SaveChangesAsync();
    }
}
