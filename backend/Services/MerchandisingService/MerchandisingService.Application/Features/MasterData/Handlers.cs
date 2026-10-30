using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using MerchandisingService.Application.Common;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Application;

internal static class MasterDataMapper
{
    public static MasterDataDto Map(string resource, object entity) => entity switch
    {
        ColorMaster c => new(c.Id, c.CompanyId, c.ColorCode, c.ColorName, c.IsActive, c.PantoneCode),
        SizeMaster s => new(s.Id, s.CompanyId, s.SizeCode, s.SizeName, s.IsActive, s.SortOrder.ToString()),
        SizeRatioTemplate t => new(t.Id, t.CompanyId, t.TemplateCode, t.TemplateName, t.IsActive, t.RatioJson),
        UnitMaster u => new(u.Id, u.CompanyId, u.UnitCode, u.UnitName, u.IsActive),
        CurrencyMaster cur => new(cur.Id, cur.CompanyId, cur.CurrencyCode, cur.CurrencyName, cur.IsActive, cur.Symbol),
        FabricTypeMaster f => new(f.Id, f.CompanyId, f.FabricTypeCode, f.FabricTypeName, f.IsActive),
        TrimsTypeMaster tr => new(tr.Id, tr.CompanyId, tr.TrimsTypeCode, tr.TrimsTypeName, tr.IsActive),
        SupplierMaster sup => new(sup.Id, sup.CompanyId, sup.SupplierCode, sup.SupplierName, sup.IsActive, sup.ContactPerson),
        Brand b => new(b.Id, b.CompanyId, b.BrandCode, b.BrandName, b.IsActive, b.BuyerId?.ToString()),
        GarmentCategory g => new(g.Id, g.CompanyId, g.CategoryCode, g.CategoryName, g.IsActive),
        _ => throw new InvalidOperationException("Invalid master data resource."),
    };
}

public sealed class MasterDataCommandHandlers(IMerchandisingDbContext db) :
    IRequestHandler<CreateMasterDataCommand, MasterDataDto>,
    IRequestHandler<UpdateMasterDataCommand, MasterDataDto>,
    IRequestHandler<DeleteMasterDataCommand, Unit>
{
    public async Task<MasterDataDto> Handle(CreateMasterDataCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var entity = CreateEntity(command.Resource, request.CompanyId, request.Code.Trim(), request.Name.Trim(), request.Extra);
        AddEntity(db, entity);
        await db.SaveChangesAsync(cancellationToken);
        return MasterDataMapper.Map(command.Resource, entity);
    }

    public async Task<MasterDataDto> Handle(UpdateMasterDataCommand command, CancellationToken cancellationToken)
    {
        var entity = await GetEntityAsync(command.Resource, command.Id, cancellationToken) ?? throw new KeyNotFoundException("Master data record not found.");
        UpdateEntity(entity, command.Request.Name.Trim(), command.Request.IsActive, command.Request.Extra);
        if (entity is MerchandisingService.Domain.AuditableEntity auditable)
        {
            auditable.UpdatedAt = BusinessTime.Now;
        }

        await db.SaveChangesAsync(cancellationToken);
        return MasterDataMapper.Map(command.Resource, entity);
    }

    public async Task<Unit> Handle(DeleteMasterDataCommand command, CancellationToken cancellationToken)
    {
        var entity = await GetEntityAsync(command.Resource, command.Id, cancellationToken) ?? throw new KeyNotFoundException("Master data record not found.");
        RemoveEntity(db, entity);
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }

    private static void AddEntity(IMerchandisingDbContext db, object entity)
    {
        switch (entity)
        {
            case ColorMaster c: db.Add(c); break;
            case SizeMaster s: db.Add(s); break;
            case SizeRatioTemplate t: db.Add(t); break;
            case UnitMaster u: db.Add(u); break;
            case CurrencyMaster cur: db.Add(cur); break;
            case FabricTypeMaster f: db.Add(f); break;
            case TrimsTypeMaster tr: db.Add(tr); break;
            case SupplierMaster sup: db.Add(sup); break;
            case Brand b: db.Add(b); break;
            case GarmentCategory g: db.Add(g); break;
            default: throw new InvalidOperationException("Invalid master data resource.");
        }
    }

    private static void RemoveEntity(IMerchandisingDbContext db, object entity)
    {
        switch (entity)
        {
            case ColorMaster c: db.Remove(c); break;
            case SizeMaster s: db.Remove(s); break;
            case SizeRatioTemplate t: db.Remove(t); break;
            case UnitMaster u: db.Remove(u); break;
            case CurrencyMaster cur: db.Remove(cur); break;
            case FabricTypeMaster f: db.Remove(f); break;
            case TrimsTypeMaster tr: db.Remove(tr); break;
            case SupplierMaster sup: db.Remove(sup); break;
            case Brand b: db.Remove(b); break;
            case GarmentCategory g: db.Remove(g); break;
            default: throw new InvalidOperationException("Invalid master data resource.");
        }
    }

    private static object CreateEntity(string resource, Guid companyId, string code, string name, string? extra) => resource.ToLowerInvariant() switch
    {
        "colors" => new ColorMaster { CompanyId = companyId, ColorCode = code, ColorName = name, PantoneCode = extra },
        "sizes" => new SizeMaster { CompanyId = companyId, SizeCode = code, SizeName = name, SortOrder = int.TryParse(extra, out var s) ? s : 0 },
        "size-ratios" => new SizeRatioTemplate { CompanyId = companyId, TemplateCode = code, TemplateName = name, RatioJson = extra },
        "units" => new UnitMaster { CompanyId = companyId, UnitCode = code, UnitName = name },
        "currencies" => new CurrencyMaster { CompanyId = companyId, CurrencyCode = code, CurrencyName = name, Symbol = extra },
        "fabric-types" => new FabricTypeMaster { CompanyId = companyId, FabricTypeCode = code, FabricTypeName = name },
        "trims-types" => new TrimsTypeMaster { CompanyId = companyId, TrimsTypeCode = code, TrimsTypeName = name },
        "suppliers" => new SupplierMaster { CompanyId = companyId, SupplierCode = code, SupplierName = name, ContactPerson = extra },
        "brands" => new Brand { CompanyId = companyId, BrandCode = code, BrandName = name, BuyerId = Guid.TryParse(extra, out var b) ? b : null },
        "garment-categories" => new GarmentCategory { CompanyId = companyId, CategoryCode = code, CategoryName = name },
        _ => throw new InvalidOperationException("Invalid master data resource."),
    };

    private static void UpdateEntity(object entity, string name, bool isActive, string? extra)
    {
        switch (entity)
        {
            case ColorMaster c: c.ColorName = name; c.IsActive = isActive; if (extra is not null) c.PantoneCode = extra; break;
            case SizeMaster s: s.SizeName = name; s.IsActive = isActive; break;
            case SizeRatioTemplate t: t.TemplateName = name; t.IsActive = isActive; if (extra is not null) t.RatioJson = extra; break;
            case UnitMaster u: u.UnitName = name; u.IsActive = isActive; break;
            case CurrencyMaster cur: cur.CurrencyName = name; cur.IsActive = isActive; if (extra is not null) cur.Symbol = extra; break;
            case FabricTypeMaster f: f.FabricTypeName = name; f.IsActive = isActive; break;
            case TrimsTypeMaster tr: tr.TrimsTypeName = name; tr.IsActive = isActive; break;
            case SupplierMaster sup: sup.SupplierName = name; sup.IsActive = isActive; break;
            case Brand b: b.BrandName = name; b.IsActive = isActive; if (extra is not null && Guid.TryParse(extra, out var buyerId)) b.BuyerId = buyerId; break;
            case GarmentCategory g: g.CategoryName = name; g.IsActive = isActive; break;
        }
    }

    private async Task<object?> GetEntityAsync(string resource, Guid id, CancellationToken cancellationToken) => resource.ToLowerInvariant() switch
    {
        "colors" => await db.ColorMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        "sizes" => await db.SizeMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        "size-ratios" => await db.SizeRatioTemplates.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        "units" => await db.UnitMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        "currencies" => await db.CurrencyMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        "fabric-types" => await db.FabricTypeMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        "trims-types" => await db.TrimsTypeMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        "suppliers" => await db.SupplierMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        "brands" => await db.Brands.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        "garment-categories" => await db.GarmentCategories.FirstOrDefaultAsync(x => x.Id == id, cancellationToken),
        _ => throw new InvalidOperationException("Invalid master data resource."),
    };
}

public sealed class MasterDataQueryHandlers(IMerchandisingDbContext db) :
    IRequestHandler<GetMasterDataListQuery, IReadOnlyList<MasterDataDto>>,
    IRequestHandler<GetMasterDataByIdQuery, MasterDataDto>
{
    public Task<IReadOnlyList<MasterDataDto>> Handle(GetMasterDataListQuery query, CancellationToken cancellationToken) =>
        query.Resource.ToLowerInvariant() switch
        {
            "colors" => MapList(db.ColorMasters.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            "sizes" => MapList(db.SizeMasters.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            "size-ratios" => MapList(db.SizeRatioTemplates.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            "units" => MapList(db.UnitMasters.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            "currencies" => MapList(db.CurrencyMasters.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            "fabric-types" => MapList(db.FabricTypeMasters.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            "trims-types" => MapList(db.TrimsTypeMasters.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            "suppliers" => MapList(db.SupplierMasters.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            "brands" => MapList(db.Brands.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            "garment-categories" => MapList(db.GarmentCategories.Where(x => x.CompanyId == query.CompanyId), query.Resource, cancellationToken),
            _ => throw new InvalidOperationException("Invalid master data resource."),
        };

    public async Task<MasterDataDto> Handle(GetMasterDataByIdQuery query, CancellationToken cancellationToken)
    {
        object? entity = query.Resource.ToLowerInvariant() switch
        {
            "colors" => await db.ColorMasters.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            "sizes" => await db.SizeMasters.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            "size-ratios" => await db.SizeRatioTemplates.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            "units" => await db.UnitMasters.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            "currencies" => await db.CurrencyMasters.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            "fabric-types" => await db.FabricTypeMasters.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            "trims-types" => await db.TrimsTypeMasters.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            "suppliers" => await db.SupplierMasters.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            "brands" => await db.Brands.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            "garment-categories" => await db.GarmentCategories.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) as object,
            _ => throw new InvalidOperationException("Invalid master data resource."),
        };

        if (entity is null)
        {
            throw new KeyNotFoundException("Master data record not found.");
        }

        return MasterDataMapper.Map(query.Resource, entity);
    }

    private static async Task<IReadOnlyList<MasterDataDto>> MapList<T>(IQueryable<T> queryable, string resource, CancellationToken cancellationToken)
    {
        var items = await queryable.ToListAsync(cancellationToken);
        return items.Select(x => MasterDataMapper.Map(resource, x!)).OrderBy(x => x.Name).ToList();
    }
}

public sealed class MasterColorImportHandlers(IMerchandisingDbContext db) :
    IRequestHandler<GetColorImportTemplateQuery, byte[]>,
    IRequestHandler<ImportColorsCommand, ColorImportResultDto>
{
    private static readonly string[] ColorHeaders = ["ColorCode", "ColorName", "PantoneCode"];

    public Task<byte[]> Handle(GetColorImportTemplateQuery query, CancellationToken cancellationToken) =>
        Task.FromResult(CsvHelper.BuildTemplate(ColorHeaders));

    public async Task<ColorImportResultDto> Handle(ImportColorsCommand command, CancellationToken cancellationToken)
    {
        var parsedRows = CsvHelper.Parse(command.FileStream);
        var created = 0;
        var updated = 0;
        var skipped = 0;
        var errors = new List<string>();
        var rowNumber = 1;

        foreach (var row in parsedRows)
        {
            rowNumber++;
            var colorCode = CsvHelper.Get(row, "ColorCode");
            var colorName = CsvHelper.Get(row, "ColorName");
            var pantoneCode = CsvHelper.Get(row, "PantoneCode");

            if (string.IsNullOrWhiteSpace(colorCode) || string.IsNullOrWhiteSpace(colorName))
            {
                skipped++;
                errors.Add($"Row {rowNumber}: ColorCode and ColorName are required.");
                continue;
            }

            var existing = await db.ColorMasters.FirstOrDefaultAsync(
                x => x.CompanyId == command.CompanyId && x.ColorCode == colorCode,
                cancellationToken);

            if (existing is null)
            {
                db.Add(new ColorMaster
                {
                    CompanyId = command.CompanyId,
                    ColorCode = colorCode,
                    ColorName = colorName,
                    PantoneCode = string.IsNullOrWhiteSpace(pantoneCode) ? null : pantoneCode,
                });
                created++;
            }
            else
            {
                existing.ColorName = colorName;
                existing.PantoneCode = string.IsNullOrWhiteSpace(pantoneCode) ? null : pantoneCode;
                existing.IsActive = true;
                existing.UpdatedAt = BusinessTime.Now;
                updated++;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return new ColorImportResultDto(created, updated, skipped, errors);
    }
}
