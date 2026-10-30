using ClosedXML.Excel;
using CompanyService.Domain.Entities;
using CompanyService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using CompanyEntity = CompanyService.Domain.Entities.Company;

namespace EnterpriseERP.Platform.Host.ImportExport;

public sealed class CompanyOrganogramImportService(CompanyDbContext db)
{
    public async Task<CompanyOrganogramImportResult> ImportAsync(Stream fileStream, CancellationToken cancellationToken)
    {
        var (rows, parseErrors) = CompanyOrganogramExcelParser.Parse(fileStream);
        var result = new CompanyOrganogramImportResult
        {
            TotalRows = rows.Count + CountDistinctErrorRows(parseErrors),
            FailedRows = CountDistinctErrorRows(parseErrors),
            Errors = parseErrors,
        };

        if (rows.Count == 0)
        {
            return result;
        }

        var companyCache = new Dictionary<string, CompanyEntity>(StringComparer.OrdinalIgnoreCase);
        var departmentCache = new Dictionary<string, Department>(StringComparer.OrdinalIgnoreCase);
        var sectionCache = new Dictionary<string, Section>(StringComparer.OrdinalIgnoreCase);
        var designationCache = new Dictionary<string, Designation>(StringComparer.OrdinalIgnoreCase);
        var lineCache = new Dictionary<string, Line>(StringComparer.OrdinalIgnoreCase);

        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
            foreach (var row in rows)
            {
                var company = await ResolveOrCreateCompanyAsync(row, result, companyCache, cancellationToken);
                if (company is null)
                {
                    continue;
                }

                var dept = await UpsertDepartmentAsync(company.Id, row, result, departmentCache, cancellationToken);
                if (dept is null)
                {
                    continue;
                }

                var section = await UpsertSectionAsync(dept.Id, row, result, sectionCache, cancellationToken);
                if (section is null)
                {
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(row.DesignationNameEn))
                {
                    if (!await UpsertDesignationAsync(section.Id, row, result, designationCache, cancellationToken))
                    {
                        continue;
                    }
                }

                if (!string.IsNullOrWhiteSpace(row.LineNameEn))
                {
                    if (!await UpsertLineAsync(section.Id, row, result, lineCache, cancellationToken))
                    {
                        continue;
                    }
                }

                result.SuccessRows++;
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

    private async Task<CompanyEntity?> ResolveOrCreateCompanyAsync(
        CompanyOrganogramImportRow row,
        CompanyOrganogramImportResult result,
        Dictionary<string, CompanyEntity> cache,
        CancellationToken cancellationToken)
    {
        var nameEn = NormalizeName(row.CompanyNameEn);
        if (nameEn.Length == 0)
        {
            AddError(result, row.RowIndex, "CompanyNameEn", "CompanyNameEn is required");
            return null;
        }

        if (cache.TryGetValue(nameEn, out var cached))
        {
            return cached;
        }

        var company = await FindCompanyByNameAsync(nameEn, cancellationToken);
        var now = DateTime.UtcNow;
        if (company is not null)
        {
            company.CompanyNameEn = nameEn;
            var nameBn = NormalizeName(row.CompanyNameBn);
            company.CompanyNameBn = nameBn.Length == 0 ? nameEn : nameBn;
            company.UpdatedAt = now;
            db.Companies.Update(company);
            cache[nameEn] = company;
            return company;
        }

        var bn = NormalizeName(row.CompanyNameBn);
        if (bn.Length == 0)
        {
            bn = nameEn;
        }

        company = new CompanyEntity
        {
            Id = Guid.NewGuid(),
            CompanyNameEn = nameEn,
            CompanyNameBn = bn,
            Status = "Active",
            CreatedAt = now,
        };
        db.Companies.Add(company);
        result.CompaniesCreated++;
        cache[nameEn] = company;
        return company;
    }

    private async Task<Department?> UpsertDepartmentAsync(
        Guid companyId,
        CompanyOrganogramImportRow row,
        CompanyOrganogramImportResult result,
        Dictionary<string, Department> cache,
        CancellationToken cancellationToken)
    {
        var nameEn = NormalizeName(row.DepartmentNameEn);
        var cacheKey = $"{companyId:N}|{nameEn}";
        try
        {
            if (cache.TryGetValue(cacheKey, out var cachedDept))
            {
                return cachedDept;
            }

            var existing = await FindDepartmentAsync(companyId, nameEn, cancellationToken);
            var now = DateTime.UtcNow;
            if (existing is not null)
            {
                existing.NameEn = nameEn;
                existing.NameBn = FallbackBn(row.DepartmentNameBn, nameEn);
                existing.IsActive = row.IsActive;
                existing.UpdatedAt = now;
                db.Departments.Update(existing);
                result.DepartmentsUpdated++;
                cache[cacheKey] = existing;
                return existing;
            }

            var dept = new Department
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                NameEn = nameEn,
                NameBn = FallbackBn(row.DepartmentNameBn, nameEn),
                IsActive = row.IsActive,
                CreatedAt = now,
            };
            db.Departments.Add(dept);
            result.DepartmentsCreated++;
            cache[cacheKey] = dept;
            return dept;
        }
        catch (Exception ex)
        {
            AddError(result, row.RowIndex, "DepartmentNameEn", ex.Message);
            return null;
        }
    }

    private async Task<Section?> UpsertSectionAsync(
        Guid departmentId,
        CompanyOrganogramImportRow row,
        CompanyOrganogramImportResult result,
        Dictionary<string, Section> cache,
        CancellationToken cancellationToken)
    {
        var nameEn = NormalizeName(row.SectionNameEn);
        var cacheKey = $"{departmentId:N}|{nameEn}";
        try
        {
            if (cache.TryGetValue(cacheKey, out var cachedSection))
            {
                return cachedSection;
            }

            var existing = await FindSectionAsync(departmentId, nameEn, cancellationToken);
            var now = DateTime.UtcNow;
            if (existing is not null)
            {
                existing.NameEn = nameEn;
                existing.NameBn = FallbackBn(row.SectionNameBn, nameEn);
                existing.IsActive = row.IsActive;
                existing.UpdatedAt = now;
                db.Sections.Update(existing);
                result.SectionsUpdated++;
                cache[cacheKey] = existing;
                return existing;
            }

            var section = new Section
            {
                Id = Guid.NewGuid(),
                DepartmentId = departmentId,
                NameEn = nameEn,
                NameBn = FallbackBn(row.SectionNameBn, nameEn),
                IsActive = row.IsActive,
                CreatedAt = now,
            };
            db.Sections.Add(section);
            result.SectionsCreated++;
            cache[cacheKey] = section;
            return section;
        }
        catch (Exception ex)
        {
            AddError(result, row.RowIndex, "SectionNameEn", ex.Message);
            return null;
        }
    }

    private async Task<bool> UpsertDesignationAsync(
        Guid sectionId,
        CompanyOrganogramImportRow row,
        CompanyOrganogramImportResult result,
        Dictionary<string, Designation> cache,
        CancellationToken cancellationToken)
    {
        var nameEn = NormalizeName(row.DesignationNameEn);
        var cacheKey = $"{sectionId:N}|{nameEn}";
        try
        {
            if (cache.TryGetValue(cacheKey, out var cached))
            {
                ApplyDesignationFields(cached, row, nameEn);
                result.DesignationsUpdated++;
                return true;
            }

            var existing = await FindDesignationAsync(sectionId, nameEn, cancellationToken);
            var now = DateTime.UtcNow;
            if (existing is not null)
            {
                ApplyDesignationFields(existing, row, nameEn);
                existing.UpdatedAt = now;
                cache[cacheKey] = existing;
                result.DesignationsUpdated++;
                return true;
            }

            var designation = new Designation
            {
                Id = Guid.NewGuid(),
                SectionId = sectionId,
                NameEn = nameEn,
                NameBn = FallbackBn(row.DesignationNameBn, nameEn),
                IsActive = row.IsActive,
                CreatedAt = now,
            };
            db.Designations.Add(designation);
            cache[cacheKey] = designation;
            result.DesignationsCreated++;
            return true;
        }
        catch (Exception ex)
        {
            AddError(result, row.RowIndex, "DesignationNameEn", ex.Message);
            return false;
        }
    }

    private async Task<bool> UpsertLineAsync(
        Guid sectionId,
        CompanyOrganogramImportRow row,
        CompanyOrganogramImportResult result,
        Dictionary<string, Line> cache,
        CancellationToken cancellationToken)
    {
        var nameEn = NormalizeName(row.LineNameEn);
        var cacheKey = $"{sectionId:N}|{nameEn}";
        try
        {
            if (cache.TryGetValue(cacheKey, out var cached))
            {
                ApplyLineFields(cached, row, nameEn);
                result.LinesUpdated++;
                return true;
            }

            var existing = await FindLineAsync(sectionId, nameEn, cancellationToken);
            var now = DateTime.UtcNow;
            if (existing is not null)
            {
                ApplyLineFields(existing, row, nameEn);
                existing.UpdatedAt = now;
                cache[cacheKey] = existing;
                result.LinesUpdated++;
                return true;
            }

            var line = new Line
            {
                Id = Guid.NewGuid(),
                SectionId = sectionId,
                NameEn = nameEn,
                NameBn = FallbackBn(row.LineNameBn, nameEn),
                IsActive = row.IsActive,
                CreatedAt = now,
            };
            db.Lines.Add(line);
            cache[cacheKey] = line;
            result.LinesCreated++;
            return true;
        }
        catch (Exception ex)
        {
            AddError(result, row.RowIndex, "LineNameEn", ex.Message);
            return false;
        }
    }

    private static void ApplyDesignationFields(Designation designation, CompanyOrganogramImportRow row, string nameEn)
    {
        designation.NameEn = nameEn;
        designation.NameBn = FallbackBn(row.DesignationNameBn, nameEn);
        designation.IsActive = row.IsActive;
    }

    private static void ApplyLineFields(Line line, CompanyOrganogramImportRow row, string nameEn)
    {
        line.NameEn = nameEn;
        line.NameBn = FallbackBn(row.LineNameBn, nameEn);
        line.IsActive = row.IsActive;
    }

    private async Task<CompanyEntity?> FindCompanyByNameAsync(string nameEn, CancellationToken cancellationToken)
    {
        var local = db.Companies.Local.FirstOrDefault(c =>
            string.Equals(NormalizeName(c.CompanyNameEn), nameEn, StringComparison.OrdinalIgnoreCase));
        if (local is not null)
        {
            return local;
        }

        var companies = await db.Companies.ToListAsync(cancellationToken);
        return companies.FirstOrDefault(c =>
            string.Equals(NormalizeName(c.CompanyNameEn), nameEn, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<Department?> FindDepartmentAsync(Guid companyId, string nameEn, CancellationToken cancellationToken)
    {
        var local = db.Departments.Local
            .Where(d => d.CompanyId == companyId)
            .FirstOrDefault(d =>
                string.Equals(NormalizeName(d.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
        if (local is not null)
        {
            return local;
        }

        var items = await db.Departments
            .Where(d => d.CompanyId == companyId)
            .OrderBy(d => d.CreatedAt)
            .ThenBy(d => d.Id)
            .ToListAsync(cancellationToken);
        return items.FirstOrDefault(d =>
            string.Equals(NormalizeName(d.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<Section?> FindSectionAsync(Guid departmentId, string nameEn, CancellationToken cancellationToken)
    {
        var local = db.Sections.Local
            .Where(s => s.DepartmentId == departmentId)
            .FirstOrDefault(s =>
                string.Equals(NormalizeName(s.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
        if (local is not null)
        {
            return local;
        }

        var items = await db.Sections
            .Where(s => s.DepartmentId == departmentId)
            .OrderBy(s => s.CreatedAt)
            .ThenBy(s => s.Id)
            .ToListAsync(cancellationToken);
        return items.FirstOrDefault(s =>
            string.Equals(NormalizeName(s.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<Designation?> FindDesignationAsync(Guid sectionId, string nameEn, CancellationToken cancellationToken)
    {
        var local = db.Designations.Local
            .Where(d => d.SectionId == sectionId)
            .FirstOrDefault(d =>
                string.Equals(NormalizeName(d.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
        if (local is not null)
        {
            return local;
        }

        var items = await db.Designations
            .Where(d => d.SectionId == sectionId)
            .OrderBy(d => d.CreatedAt)
            .ThenBy(d => d.Id)
            .ToListAsync(cancellationToken);
        return items.FirstOrDefault(d =>
            string.Equals(NormalizeName(d.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<Line?> FindLineAsync(Guid sectionId, string nameEn, CancellationToken cancellationToken)
    {
        var local = db.Lines.Local
            .Where(l => l.SectionId == sectionId)
            .FirstOrDefault(l =>
                string.Equals(NormalizeName(l.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
        if (local is not null)
        {
            return local;
        }

        var items = await db.Lines
            .Where(l => l.SectionId == sectionId)
            .OrderBy(l => l.CreatedAt)
            .ThenBy(l => l.Id)
            .ToListAsync(cancellationToken);
        return items.FirstOrDefault(l =>
            string.Equals(NormalizeName(l.NameEn), nameEn, StringComparison.OrdinalIgnoreCase));
    }

    private static void AddError(CompanyOrganogramImportResult result, int row, string column, string message)
    {
        result.Errors.Add(new OrganogramRowError { Row = row, Column = column, Message = message });
        result.FailedRows++;
    }

    private static int CountDistinctErrorRows(IEnumerable<OrganogramRowError> errors) =>
        errors.Select(e => e.Row).Distinct().Count();

    private static string NormalizeName(string value) =>
        string.Join(' ', value.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    private static string FallbackBn(string bn, string en)
    {
        var normalized = NormalizeName(bn);
        return normalized.Length == 0 ? en : normalized;
    }

    public async Task<byte[]> ExportAsync(string? companyName, CancellationToken cancellationToken)
    {
        var query =
            from c in db.Companies
            join d in db.Departments on c.Id equals d.CompanyId
            join s in db.Sections on d.Id equals s.DepartmentId
            join des in db.Designations on s.Id equals des.SectionId into desigs
            from des in desigs.DefaultIfEmpty()
            join ln in db.Lines on s.Id equals ln.SectionId into lines
            from ln in lines.DefaultIfEmpty()
            orderby c.CompanyNameEn, d.NameEn, s.NameEn, des.NameEn, ln.NameEn
            select new
            {
                c.CompanyNameEn,
                CompanyNameBn = c.CompanyNameBn ?? "",
                d.NameEn,
                d.NameBn,
                d.IsActive,
                SectionNameEn = s.NameEn,
                SectionNameBn = s.NameBn,
                SectionActive = s.IsActive,
                DesignationNameEn = des != null ? des.NameEn : "",
                DesignationNameBn = des != null ? des.NameBn : "",
                DesignationActive = des != null && des.IsActive,
                LineNameEn = ln != null ? ln.NameEn : "",
                LineNameBn = ln != null ? ln.NameBn : "",
                LineActive = ln != null && ln.IsActive,
            };

        var rows = await query.ToListAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(companyName))
        {
            var filter = NormalizeName(companyName);
            rows = rows
                .Where(x => string.Equals(NormalizeName(x.CompanyNameEn), filter, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("CompanyOrganogram");
        var headers = new[]
        {
            "CompanyNameEn", "CompanyNameBn",
            "DepartmentNameEn", "DepartmentNameBn",
            "SectionNameEn", "SectionNameBn",
            "DesignationNameEn", "DesignationNameBn",
            "LineNameEn", "LineNameBn", "IsActive",
        };
        for (var i = 0; i < headers.Length; i++)
        {
            sheet.Cell(1, i + 1).Value = headers[i];
        }

        var r = 2;
        foreach (var row in rows)
        {
            var active = row.IsActive && row.SectionActive && row.DesignationActive && row.LineActive;
            sheet.Cell(r, 1).Value = row.CompanyNameEn;
            sheet.Cell(r, 2).Value = row.CompanyNameBn;
            sheet.Cell(r, 3).Value = row.NameEn;
            sheet.Cell(r, 4).Value = row.NameBn;
            sheet.Cell(r, 5).Value = row.SectionNameEn;
            sheet.Cell(r, 6).Value = row.SectionNameBn;
            sheet.Cell(r, 7).Value = row.DesignationNameEn;
            sheet.Cell(r, 8).Value = row.DesignationNameBn;
            sheet.Cell(r, 9).Value = row.LineNameEn;
            sheet.Cell(r, 10).Value = row.LineNameBn;
            sheet.Cell(r, 11).Value = active ? "Active" : "Inactive";
            r++;
        }

        sheet.Row(1).Style.Font.Bold = true;
        sheet.SheetView.FreezeRows(1);
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
