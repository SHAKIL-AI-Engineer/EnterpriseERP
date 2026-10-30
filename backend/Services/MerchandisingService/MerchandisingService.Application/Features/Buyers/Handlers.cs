using AutoMapper;
using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using MerchandisingService.Application.Common;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Application;

public sealed class BuyerCommandHandlers(
    IUnitOfWork uow,
    IMapper mapper,
    IRedisCacheService cache,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateBuyerCommand, BuyerDto>,
    IRequestHandler<UpdateBuyerCommand, BuyerDto>,
    IRequestHandler<ActivateBuyerCommand, BuyerDto>
{
    public async Task<BuyerDto> Handle(CreateBuyerCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var exists = await uow.Buyers.Query().AnyAsync(x => x.CompanyId == request.CompanyId && x.BuyerCode == request.BuyerCode, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Buyer code already exists for this company.");
        }

        var buyer = new Buyer
        {
            CompanyId = request.CompanyId,
            BuyerCode = request.BuyerCode.Trim(),
            BuyerName = request.BuyerName.Trim(),
            Country = request.Country,
            ContactPerson = request.ContactPerson,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            PaymentTerms = request.PaymentTerms,
            Currency = request.Currency,
            LeadTimeDays = request.LeadTimeDays,
        };

        await uow.Buyers.AddAsync(buyer, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Buyers(request.CompanyId), cancellationToken);
        await publisher.PublishAsync(new BuyerCreated(buyer.CompanyId, buyer.Id, buyer.BuyerCode, buyer.BuyerName), cancellationToken);
        return mapper.Map<BuyerDto>(buyer);
    }

    public async Task<BuyerDto> Handle(UpdateBuyerCommand command, CancellationToken cancellationToken)
    {
        var buyer = await uow.Buyers.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Buyer not found.");
        buyer.BuyerName = command.Request.BuyerName.Trim();
        buyer.Country = command.Request.Country;
        buyer.ContactPerson = command.Request.ContactPerson;
        buyer.Email = command.Request.Email;
        buyer.Phone = command.Request.Phone;
        buyer.Address = command.Request.Address;
        buyer.PaymentTerms = command.Request.PaymentTerms;
        buyer.Currency = command.Request.Currency;
        buyer.LeadTimeDays = command.Request.LeadTimeDays;
        buyer.IsActive = command.Request.IsActive;
        buyer.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Buyers(buyer.CompanyId), cancellationToken);
        return mapper.Map<BuyerDto>(buyer);
    }

    public async Task<BuyerDto> Handle(ActivateBuyerCommand command, CancellationToken cancellationToken)
    {
        var buyer = await uow.Buyers.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Buyer not found.");
        buyer.IsActive = command.IsActive;
        buyer.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.Buyers(buyer.CompanyId), cancellationToken);
        return mapper.Map<BuyerDto>(buyer);
    }
}

public sealed class BuyerQueryHandlers(IUnitOfWork uow, IMapper mapper, IRedisCacheService cache) :
    IRequestHandler<GetBuyersQuery, IReadOnlyList<BuyerDto>>,
    IRequestHandler<GetBuyerByIdQuery, BuyerDto>
{
    public async Task<IReadOnlyList<BuyerDto>> Handle(GetBuyersQuery query, CancellationToken cancellationToken)
    {
        var key = CacheKeys.Buyers(query.CompanyId);
        var cached = await cache.GetAsync<IReadOnlyList<BuyerDto>>(key, cancellationToken);
        if (cached is not null)
        {
            return cached;
        }

        var buyers = await uow.Buyers.Query().Where(x => x.CompanyId == query.CompanyId).OrderBy(x => x.BuyerName).ToListAsync(cancellationToken);
        var result = mapper.Map<IReadOnlyList<BuyerDto>>(buyers);
        await cache.SetAsync(key, result, TimeSpan.FromHours(6), cancellationToken);
        return result;
    }

    public async Task<BuyerDto> Handle(GetBuyerByIdQuery query, CancellationToken cancellationToken)
    {
        var buyer = await uow.Buyers.GetByIdAsync(query.Id, cancellationToken) ?? throw new KeyNotFoundException("Buyer not found.");
        if (buyer.CompanyId != query.CompanyId)
        {
            throw new KeyNotFoundException("Buyer not found.");
        }

        return mapper.Map<BuyerDto>(buyer);
    }
}
