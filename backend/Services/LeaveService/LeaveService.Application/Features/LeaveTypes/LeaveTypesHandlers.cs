using AutoMapper;
using FluentValidation;
using LeaveService.Application.Common.Exceptions;
using LeaveService.Application.Common.Interfaces;
using LeaveService.Contracts.LeaveTypes;
using LeaveService.Domain.Entities;
using MediatR;

using Erp.BuildingBlocks.SharedKernel;

namespace LeaveService.Application.Features.LeaveTypes;

public sealed record CreateLeaveTypeCommand(CreateLeaveTypeRequest Request, Guid? CreatedBy) : IRequest<LeaveTypeDto>;

public sealed record UpdateLeaveTypeCommand(Guid Id, UpdateLeaveTypeRequest Request, Guid? UpdatedBy) : IRequest<LeaveTypeDto>;

public sealed record SetLeaveTypeActiveCommand(Guid Id, bool IsActive, Guid? UpdatedBy) : IRequest<LeaveTypeDto>;

public sealed record DeleteLeaveTypeCommand(Guid Id, Guid? DeletedBy) : IRequest<Unit>;

public sealed record GetLeaveTypesQuery(Guid CompanyId) : IRequest<IReadOnlyList<LeaveTypeDto>>;

public sealed record GetLeaveTypeByIdQuery(Guid Id) : IRequest<LeaveTypeDto?>;

public sealed class CreateLeaveTypeCommandValidator : AbstractValidator<CreateLeaveTypeCommand>
{
    public CreateLeaveTypeCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.LeaveCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Request.LeaveName).NotEmpty().MaximumLength(150);
    }
}

public sealed class CreateLeaveTypeCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, ILeaveCache cache)
    : IRequestHandler<CreateLeaveTypeCommand, LeaveTypeDto>
{
    public async Task<LeaveTypeDto> Handle(CreateLeaveTypeCommand request, CancellationToken cancellationToken)
    {
        var existing = await uow.LeaveTypes.GetByCompanyAndCodeAsync(request.Request.CompanyId, request.Request.LeaveCode, cancellationToken);
        if (existing != null)
        {
            throw new LeaveBusinessException("Leave code must be unique per company.");
        }

        var entity = new LeaveType
        {
            Id = Guid.NewGuid(),
            CompanyId = request.Request.CompanyId,
            LeaveCode = request.Request.LeaveCode.Trim(),
            LeaveName = request.Request.LeaveName.Trim(),
            IsPaid = request.Request.IsPaid,
            IsCarryForward = request.Request.IsCarryForward,
            MaxCarryForwardDays = request.Request.MaxCarryForwardDays,
            IsEncashable = request.Request.IsEncashable,
            IsActive = true,
            CreatedAt = BusinessTime.Now,
            CreatedBy = request.CreatedBy,
        };
        uow.LeaveTypes.Add(entity);
        await audit.WriteAsync(entity.CompanyId, request.CreatedBy, "LeaveTypeCreated", nameof(LeaveType), entity.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync($"leaveTypes:{entity.CompanyId}", cancellationToken);
        return mapper.Map<LeaveTypeDto>(entity);
    }
}

public sealed class UpdateLeaveTypeCommandValidator : AbstractValidator<UpdateLeaveTypeCommand>
{
    public UpdateLeaveTypeCommandValidator()
    {
        RuleFor(x => x.Request.LeaveName).NotEmpty().MaximumLength(150);
    }
}

public sealed class UpdateLeaveTypeCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, ILeaveCache cache)
    : IRequestHandler<UpdateLeaveTypeCommand, LeaveTypeDto>
{
    public async Task<LeaveTypeDto> Handle(UpdateLeaveTypeCommand request, CancellationToken cancellationToken)
    {
        var entity = await uow.LeaveTypes.GetByIdAsync(request.Id, cancellationToken)
                     ?? throw new LeaveBusinessException("Leave type not found.");
        entity.LeaveName = request.Request.LeaveName.Trim();
        entity.IsPaid = request.Request.IsPaid;
        entity.IsCarryForward = request.Request.IsCarryForward;
        entity.MaxCarryForwardDays = request.Request.MaxCarryForwardDays;
        entity.IsEncashable = request.Request.IsEncashable;
        entity.UpdatedAt = BusinessTime.Now;
        entity.UpdatedBy = request.UpdatedBy;
        await audit.WriteAsync(entity.CompanyId, request.UpdatedBy, "LeaveTypeUpdated", nameof(LeaveType), entity.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync($"leaveTypes:{entity.CompanyId}", cancellationToken);
        return mapper.Map<LeaveTypeDto>(entity);
    }
}

public sealed class SetLeaveTypeActiveCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, ILeaveCache cache)
    : IRequestHandler<SetLeaveTypeActiveCommand, LeaveTypeDto>
{
    public async Task<LeaveTypeDto> Handle(SetLeaveTypeActiveCommand request, CancellationToken cancellationToken)
    {
        var entity = await uow.LeaveTypes.GetByIdAsync(request.Id, cancellationToken)
                     ?? throw new LeaveBusinessException("Leave type not found.");
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = BusinessTime.Now;
        entity.UpdatedBy = request.UpdatedBy;
        await audit.WriteAsync(entity.CompanyId, request.UpdatedBy, request.IsActive ? "LeaveTypeActivated" : "LeaveTypeDeactivated", nameof(LeaveType), entity.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync($"leaveTypes:{entity.CompanyId}", cancellationToken);
        return mapper.Map<LeaveTypeDto>(entity);
    }
}

public sealed class DeleteLeaveTypeCommandHandler(ILeaveUnitOfWork uow, ILeaveAuditService audit, ILeaveCache cache)
    : IRequestHandler<DeleteLeaveTypeCommand, Unit>
{
    public async Task<Unit> Handle(DeleteLeaveTypeCommand request, CancellationToken cancellationToken)
    {
        var entity = await uow.LeaveTypes.GetByIdAsync(request.Id, cancellationToken)
                     ?? throw new LeaveBusinessException("Leave type not found.");

        var usage = await uow.LeaveTypes.GetUsageCountsAsync(request.Id, cancellationToken);
        if (usage.Applications > 0 || usage.Balances > 0 || usage.Encashments > 0 || usage.EarnPolicies > 0)
        {
            var parts = new List<string>();
            if (usage.Applications > 0)
            {
                parts.Add($"{usage.Applications} application(s)");
            }

            if (usage.Balances > 0)
            {
                parts.Add($"{usage.Balances} balance row(s)");
            }

            if (usage.Encashments > 0)
            {
                parts.Add($"{usage.Encashments} encashment(s)");
            }

            if (usage.EarnPolicies > 0)
            {
                parts.Add($"{usage.EarnPolicies} earn-leave policy row(s)");
            }

            throw new LeaveBusinessException(
                $"Cannot delete leave type: {string.Join(", ", parts)} exist. Deactivate instead.");
        }

        var companyId = entity.CompanyId;
        uow.LeaveTypes.Remove(entity);
        await audit.WriteAsync(companyId, request.DeletedBy, "LeaveTypeDeleted", nameof(LeaveType), entity.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync($"leaveTypes:{companyId}", cancellationToken);
        return Unit.Value;
    }
}

public sealed class GetLeaveTypesQueryHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveCache cache) : IRequestHandler<GetLeaveTypesQuery, IReadOnlyList<LeaveTypeDto>>
{
    public async Task<IReadOnlyList<LeaveTypeDto>> Handle(GetLeaveTypesQuery request, CancellationToken cancellationToken)
    {
        var data = await cache.GetOrCreateAsync($"leaveTypes:{request.CompanyId}", TimeSpan.FromHours(6), async ct =>
        {
            var list = await uow.LeaveTypes.ListByCompanyAsync(request.CompanyId, ct);
            return list.Select(x => mapper.Map<LeaveTypeDto>(x)).ToList();
        }, cancellationToken);
        return data == null ? Array.Empty<LeaveTypeDto>() : data;
    }
}

public sealed class GetLeaveTypeByIdQueryHandler(ILeaveUnitOfWork uow, IMapper mapper) : IRequestHandler<GetLeaveTypeByIdQuery, LeaveTypeDto?>
{
    public async Task<LeaveTypeDto?> Handle(GetLeaveTypeByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await uow.LeaveTypes.GetByIdAsync(request.Id, cancellationToken);
        return entity == null ? null : mapper.Map<LeaveTypeDto>(entity);
    }
}
