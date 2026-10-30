using AutoMapper;
using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using MerchandisingService.Application.Common;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Application;

public sealed class CatalogCommandHandlers(
    IUnitOfWork uow,
    IMapper mapper,
    IRedisCacheService cache,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateSeasonCommand, SeasonDto>,
    IRequestHandler<CreateGarmentItemCommand, GarmentItemDto>,
    IRequestHandler<CreateStyleCommand, StyleDto>,
    IRequestHandler<UpdateStyleCommand, StyleDto>
{
    public async Task<SeasonDto> Handle(CreateSeasonCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.Seasons.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.SeasonCode == request.SeasonCode, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Season code already exists for this company.");
        }

        var season = new Season { CompanyId = request.CompanyId, SeasonCode = request.SeasonCode.Trim(), SeasonName = request.SeasonName.Trim(), YearNo = request.YearNo };
        await uow.Seasons.AddAsync(season, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<SeasonDto>(season);
    }

    public async Task<GarmentItemDto> Handle(CreateGarmentItemCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.GarmentItems.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.ItemCode == request.ItemCode, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Garment item code already exists for this company.");
        }

        var item = new GarmentItem { CompanyId = request.CompanyId, ItemCode = request.ItemCode.Trim(), ItemName = request.ItemName.Trim(), Category = request.Category };
        await uow.GarmentItems.AddAsync(item, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<GarmentItemDto>(item);
    }

    public async Task<StyleDto> Handle(CreateStyleCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var buyerExists = await uow.Buyers.Query().AnyAsync(x => x.Id == request.BuyerId && x.CompanyId == request.CompanyId, cancellationToken);
        if (!buyerExists)
        {
            throw new InvalidOperationException("Buyer does not exist for this company.");
        }

        var exists = await uow.Styles.Query().AnyAsync(x => x.BuyerId == request.BuyerId && x.StyleNo == request.StyleNo, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Style number already exists for this buyer.");
        }

        var style = new Style
        {
            CompanyId = request.CompanyId,
            BuyerId = request.BuyerId,
            SeasonId = request.SeasonId,
            GarmentItemId = request.GarmentItemId,
            BrandId = request.BrandId,
            StyleNo = request.StyleNo.Trim(),
            StyleName = request.StyleName,
            Description = request.Description,
            FabricDescription = request.FabricDescription,
        };

        await uow.Styles.AddAsync(style, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        foreach (var key in CacheKeys.StyleListInvalidationKeys(request.CompanyId, request.BuyerId))
        {
            await cache.RemoveAsync(key, cancellationToken);
        }

        await publisher.PublishAsync(new StyleCreated(style.CompanyId, style.Id, style.BuyerId, style.StyleNo), cancellationToken);
        return mapper.Map<StyleDto>(style);
    }

    public async Task<StyleDto> Handle(UpdateStyleCommand command, CancellationToken cancellationToken)
    {
        var style = await uow.Styles.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Style not found.");
        style.SeasonId = command.Request.SeasonId;
        style.GarmentItemId = command.Request.GarmentItemId;
        style.BrandId = command.Request.BrandId;
        style.StyleName = command.Request.StyleName;
        style.Description = command.Request.Description;
        style.FabricDescription = command.Request.FabricDescription;
        style.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        foreach (var key in CacheKeys.StyleListInvalidationKeys(style.CompanyId, style.BuyerId))
        {
            await cache.RemoveAsync(key, cancellationToken);
        }

        return mapper.Map<StyleDto>(style);
    }
}

public sealed class CatalogQueryHandlers(IUnitOfWork uow, IMapper mapper, IRedisCacheService cache) :
    IRequestHandler<GetSeasonsQuery, IReadOnlyList<SeasonDto>>,
    IRequestHandler<GetGarmentItemsQuery, IReadOnlyList<GarmentItemDto>>,
    IRequestHandler<GetStylesQuery, IReadOnlyList<StyleDto>>,
    IRequestHandler<GetStyleByIdQuery, StyleDto>
{
    public async Task<IReadOnlyList<SeasonDto>> Handle(GetSeasonsQuery query, CancellationToken cancellationToken)
    {
        var seasons = await uow.Seasons.Query().Where(x => x.CompanyId == query.CompanyId).OrderByDescending(x => x.YearNo).ThenBy(x => x.SeasonName).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<SeasonDto>>(seasons);
    }

    public async Task<IReadOnlyList<GarmentItemDto>> Handle(GetGarmentItemsQuery query, CancellationToken cancellationToken)
    {
        var items = await uow.GarmentItems.Query().Where(x => x.CompanyId == query.CompanyId).OrderBy(x => x.ItemName).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<GarmentItemDto>>(items);
    }

    public async Task<IReadOnlyList<StyleDto>> Handle(GetStylesQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.Styles(query.CompanyId, query.BuyerId);
        var cached = await cache.GetAsync<IReadOnlyList<StyleDto>>(key, cancellationToken);
        if (cached is { Count: > 0 })
        {
            return cached;
        }

        var stylesQuery = uow.Styles.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.BuyerId.HasValue)
        {
            stylesQuery = stylesQuery.Where(x => x.BuyerId == query.BuyerId.Value);
        }

        var styles = await stylesQuery.OrderBy(x => x.StyleNo).ToListAsync(cancellationToken);
        var result = mapper.Map<IReadOnlyList<StyleDto>>(styles);
        await cache.SetAsync(key, result, TimeSpan.FromHours(6), cancellationToken);
        return result;
    }

    public async Task<StyleDto> Handle(GetStyleByIdQuery query, CancellationToken cancellationToken)
    {
        var style = await uow.Styles.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Style not found.");
        if (style.CompanyId != query.CompanyId)
        {
            throw new KeyNotFoundException("Style not found.");
        }

        return mapper.Map<StyleDto>(style);
    }
}
