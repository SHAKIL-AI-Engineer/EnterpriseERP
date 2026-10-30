using CompanyService.Domain.Entities;
using CompanyService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.ImportExport;

public sealed class AddressImportService(CompanyDbContext db)
{
    public async Task<AddressImportResult> ImportAsync(Stream fileStream, CancellationToken cancellationToken)
    {
        var (rows, parseErrors) = AddressExcelParser.Parse(fileStream);
        var result = new AddressImportResult
        {
            TotalRows = rows.Count + parseErrors.Select(e => e.Row).Distinct().Count(),
            FailedRows = parseErrors.Select(e => e.Row).Distinct().Count(),
            Errors = parseErrors,
        };

        if (rows.Count == 0)
        {
            return result;
        }

        var countryCache = new Dictionary<string, Country>(StringComparer.OrdinalIgnoreCase);
        var divisionCache = new Dictionary<string, Division>(StringComparer.OrdinalIgnoreCase);
        var districtCache = new Dictionary<string, District>(StringComparer.OrdinalIgnoreCase);
        var upazilaCache = new Dictionary<string, Upazila>(StringComparer.OrdinalIgnoreCase);

        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            foreach (var row in rows)
            {
                try
                {
                    var country = await UpsertCountryAsync(row, result, countryCache, cancellationToken);
                    var division = await UpsertDivisionAsync(country.Id, row, result, divisionCache, cancellationToken);
                    var district = await UpsertDistrictAsync(division.Id, row, result, districtCache, cancellationToken);
                    var upazila = await UpsertUpazilaAsync(district.Id, row, result, upazilaCache, cancellationToken);
                    await UpsertPostOfficeAsync(upazila.Id, row, result, cancellationToken);
                    result.SuccessRows++;
                }
                catch (Exception ex)
                {
                    var column = "Import";
                    var message = ex.Message;
                    if (message.Contains(':'))
                    {
                        var parts = message.Split(':', 2);
                        column = parts[0].Trim();
                        message = parts[1].Trim();
                    }

                    result.Errors.Add(new OrganogramRowError { Row = row.RowIndex, Column = column, Message = message });
                    result.FailedRows++;
                }
            }

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        });

        if (result.FailedRows > result.TotalRows)
        {
            result.FailedRows = result.TotalRows;
        }

        return result;
    }

    private async Task<Country> UpsertCountryAsync(
        AddressImportRow row,
        AddressImportResult result,
        Dictionary<string, Country> cache,
        CancellationToken cancellationToken)
    {
        var nameEn = Normalize(row.CountryNameEn);
        if (cache.TryGetValue(nameEn, out var cached))
        {
            ApplyCountry(cached, row, nameEn);
            result.CountriesUpdated++;
            return cached;
        }

        var existing = await FindCountryAsync(nameEn, cancellationToken);
        if (existing is not null)
        {
            ApplyCountry(existing, row, nameEn);
            cache[nameEn] = existing;
            result.CountriesUpdated++;
            return existing;
        }

        var country = new Country
        {
            Id = Guid.NewGuid(),
            NameEn = nameEn,
            NameBn = Fallback(row.CountryNameBn, nameEn),
            Code = InferCountryCode(nameEn),
            IsActive = row.IsActive,
        };
        db.Countries.Add(country);
        cache[nameEn] = country;
        result.CountriesCreated++;
        return country;
    }

    private async Task<Division> UpsertDivisionAsync(
        Guid countryId,
        AddressImportRow row,
        AddressImportResult result,
        Dictionary<string, Division> cache,
        CancellationToken cancellationToken)
    {
        var nameEn = Normalize(row.DivisionNameEn);
        var key = $"{countryId:N}|{nameEn}";
        if (cache.TryGetValue(key, out var cached))
        {
            ApplyDivision(cached, row, nameEn);
            result.DivisionsUpdated++;
            return cached;
        }

        var existing = await FindDivisionAsync(countryId, nameEn, cancellationToken);
        if (existing is not null)
        {
            ApplyDivision(existing, row, nameEn);
            cache[key] = existing;
            result.DivisionsUpdated++;
            return existing;
        }

        var division = new Division
        {
            Id = Guid.NewGuid(),
            CountryId = countryId,
            NameEn = nameEn,
            NameBn = Fallback(row.DivisionNameBn, nameEn),
            IsActive = row.IsActive,
        };
        db.Divisions.Add(division);
        cache[key] = division;
        result.DivisionsCreated++;
        return division;
    }

    private async Task<District> UpsertDistrictAsync(
        Guid divisionId,
        AddressImportRow row,
        AddressImportResult result,
        Dictionary<string, District> cache,
        CancellationToken cancellationToken)
    {
        var nameEn = Normalize(row.DistrictNameEn);
        var key = $"{divisionId:N}|{nameEn}";
        if (cache.TryGetValue(key, out var cached))
        {
            ApplyDistrict(cached, row, nameEn);
            result.DistrictsUpdated++;
            return cached;
        }

        var existing = await FindDistrictAsync(divisionId, nameEn, cancellationToken);
        if (existing is not null)
        {
            ApplyDistrict(existing, row, nameEn);
            cache[key] = existing;
            result.DistrictsUpdated++;
            return existing;
        }

        var district = new District
        {
            Id = Guid.NewGuid(),
            DivisionId = divisionId,
            NameEn = nameEn,
            NameBn = Fallback(row.DistrictNameBn, nameEn),
            IsActive = row.IsActive,
        };
        db.Districts.Add(district);
        cache[key] = district;
        result.DistrictsCreated++;
        return district;
    }

    private async Task<Upazila> UpsertUpazilaAsync(
        Guid districtId,
        AddressImportRow row,
        AddressImportResult result,
        Dictionary<string, Upazila> cache,
        CancellationToken cancellationToken)
    {
        var nameEn = Normalize(row.ThanaNameEn);
        var key = $"{districtId:N}|{nameEn}";
        if (cache.TryGetValue(key, out var cached))
        {
            ApplyUpazila(cached, row, nameEn);
            result.ThanasUpdated++;
            return cached;
        }

        var existing = await FindUpazilaAsync(districtId, nameEn, cancellationToken);
        if (existing is not null)
        {
            ApplyUpazila(existing, row, nameEn);
            cache[key] = existing;
            result.ThanasUpdated++;
            return existing;
        }

        var upazila = new Upazila
        {
            Id = Guid.NewGuid(),
            DistrictId = districtId,
            NameEn = nameEn,
            NameBn = Fallback(row.ThanaNameBn, nameEn),
            IsActive = row.IsActive,
        };
        db.Upazilas.Add(upazila);
        cache[key] = upazila;
        result.ThanasCreated++;
        return upazila;
    }

    private async Task UpsertPostOfficeAsync(
        Guid upazilaId,
        AddressImportRow row,
        AddressImportResult result,
        CancellationToken cancellationToken)
    {
        var nameEn = Normalize(row.PostOfficeNameEn);
        var postCode = Normalize(row.PostCode);

        var local = db.PostOffices.Local.FirstOrDefault(p =>
            p.UpazilaId == upazilaId
            && string.Equals(Normalize(p.NameEn), nameEn, StringComparison.OrdinalIgnoreCase)
            && string.Equals(Normalize(p.PostalCode), postCode, StringComparison.OrdinalIgnoreCase));
        if (local is not null)
        {
            ApplyPostOffice(local, row, nameEn, postCode);
            result.PostOfficesUpdated++;
            return;
        }

        var existing = await db.PostOffices.FirstOrDefaultAsync(
            p => p.UpazilaId == upazilaId && p.NameEn == nameEn && p.PostalCode == postCode,
            cancellationToken);
        if (existing is not null)
        {
            ApplyPostOffice(existing, row, nameEn, postCode);
            result.PostOfficesUpdated++;
            return;
        }

        db.PostOffices.Add(new PostOffice
        {
            Id = Guid.NewGuid(),
            UpazilaId = upazilaId,
            NameEn = nameEn,
            NameBn = Fallback(row.PostOfficeNameBn, nameEn),
            PostalCode = postCode,
            IsActive = row.IsActive,
        });
        result.PostOfficesCreated++;
    }

    private static void ApplyCountry(Country c, AddressImportRow row, string nameEn)
    {
        c.NameEn = nameEn;
        c.NameBn = Fallback(row.CountryNameBn, nameEn);
        if (string.IsNullOrWhiteSpace(c.Code))
        {
            c.Code = InferCountryCode(nameEn);
        }

        c.IsActive = row.IsActive;
    }

    private static void ApplyDivision(Division d, AddressImportRow row, string nameEn)
    {
        d.NameEn = nameEn;
        d.NameBn = Fallback(row.DivisionNameBn, nameEn);
        d.IsActive = row.IsActive;
    }

    private static void ApplyDistrict(District d, AddressImportRow row, string nameEn)
    {
        d.NameEn = nameEn;
        d.NameBn = Fallback(row.DistrictNameBn, nameEn);
        d.IsActive = row.IsActive;
    }

    private static void ApplyUpazila(Upazila u, AddressImportRow row, string nameEn)
    {
        u.NameEn = nameEn;
        u.NameBn = Fallback(row.ThanaNameBn, nameEn);
        u.IsActive = row.IsActive;
    }

    private static void ApplyPostOffice(PostOffice p, AddressImportRow row, string nameEn, string postCode)
    {
        p.NameEn = nameEn;
        p.NameBn = Fallback(row.PostOfficeNameBn, nameEn);
        p.PostalCode = postCode;
        p.IsActive = row.IsActive;
    }

    private async Task<Country?> FindCountryAsync(string nameEn, CancellationToken cancellationToken)
    {
        var items = await db.Countries.ToListAsync(cancellationToken);
        return items.FirstOrDefault(c => string.Equals(Normalize(c.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<Division?> FindDivisionAsync(Guid countryId, string nameEn, CancellationToken cancellationToken)
    {
        var items = await db.Divisions.Where(d => d.CountryId == countryId).ToListAsync(cancellationToken);
        return items.FirstOrDefault(d => string.Equals(Normalize(d.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<District?> FindDistrictAsync(Guid divisionId, string nameEn, CancellationToken cancellationToken)
    {
        var items = await db.Districts.Where(d => d.DivisionId == divisionId).ToListAsync(cancellationToken);
        return items.FirstOrDefault(d => string.Equals(Normalize(d.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<Upazila?> FindUpazilaAsync(Guid districtId, string nameEn, CancellationToken cancellationToken)
    {
        var items = await db.Upazilas.Where(u => u.DistrictId == districtId).ToListAsync(cancellationToken);
        return items.FirstOrDefault(u => string.Equals(Normalize(u.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
    }

    private static string Normalize(string value) =>
        string.Join(' ', value.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    private static string Fallback(string bn, string _) => Normalize(bn);

    private static string InferCountryCode(string nameEn) =>
        nameEn.Length >= 2 ? nameEn[..2].ToUpperInvariant() : "XX";
}
