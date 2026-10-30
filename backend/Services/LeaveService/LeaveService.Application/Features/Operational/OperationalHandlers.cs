using AutoMapper;
using Erp.BuildingBlocks.Contracts.Pagination;
using Erp.BuildingBlocks.EventBus;
using LeaveService.Application.Common.Exceptions;
using LeaveService.Application.Common.Interfaces;
using LeaveService.Contracts.DayTypes;
using LeaveService.Contracts.EarnLeaves;
using LeaveService.Contracts.Holidays;
using LeaveService.Contracts.LeaveBalances;
using LeaveService.Contracts.LeaveEncashments;
using LeaveService.Contracts.LeavePolicies;
using LeaveService.Contracts.WeeklyOffs;
using LeaveService.Domain.Entities;
using MediatR;

using Erp.BuildingBlocks.SharedKernel;

namespace LeaveService.Application.Features.Operational;

public sealed record CreateLeavePolicyCommand(CreateLeavePolicyRequest Request) : IRequest<LeavePolicyDto>;

public sealed record UpdateLeavePolicyCommand(Guid Id, UpdateLeavePolicyRequest Request) : IRequest<LeavePolicyDto>;

public sealed record GetLeavePoliciesQuery(Guid CompanyId) : IRequest<IReadOnlyList<LeavePolicyDto>>;

public sealed record GenerateYearlyBalancesCommand(GenerateYearlyBalancesRequest Request) : IRequest<int>;

public sealed record AccrueMonthlyBalancesCommand(AccrueMonthlyBalancesRequest Request) : IRequest<int>;

public sealed record GetEmployeeLeaveBalancesQuery(Guid CompanyId, Guid EmployeeId, int Year) : IRequest<IReadOnlyList<EmployeeLeaveBalanceDto>>;

public sealed record AdjustLeaveBalanceCommand(AdjustLeaveBalanceRequest Request, Guid? AdjustedBy) : IRequest<EmployeeLeaveBalanceDto>;

public sealed record CreateHolidayCommand(HolidayRequest Request) : IRequest<HolidayDto>;

public sealed record UpdateHolidayCommand(Guid Id, HolidayRequest Request) : IRequest<HolidayDto>;

public sealed class HolidayListQuery : PagedRequest
{
    public Guid CompanyId { get; set; }
    public int Year { get; set; }
}

public sealed record GetHolidaysQuery(HolidayListQuery Query) : IRequest<PaginatedList<HolidayDto>>;

public sealed record DeleteHolidayCommand(Guid Id) : IRequest<Unit>;

public sealed record CreateWeeklyOffCommand(WeeklyOffRequest Request) : IRequest<WeeklyOffDto>;

public sealed record GetWeeklyOffsQuery(Guid CompanyId) : IRequest<IReadOnlyList<WeeklyOffDto>>;

public sealed record DeleteWeeklyOffCommand(Guid Id) : IRequest<Unit>;

public sealed record GenerateEarnLeaveCommand(GenerateEarnLeaveRequest Request) : IRequest<EarnLeaveSummaryDto>;

public sealed record GetEarnLeaveSummaryQuery(Guid CompanyId, Guid EmployeeId, int Year) : IRequest<IReadOnlyList<EmployeeLeaveBalanceDto>>;

public sealed record CreateLeaveEncashmentCommand(LeaveEncashmentRequest Request) : IRequest<LeaveEncashmentDto>;

public sealed class LeaveEncashmentListQuery : PagedRequest
{
    public Guid CompanyId { get; set; }
    public int? Year { get; set; }
}

public sealed record GetLeaveEncashmentsQuery(LeaveEncashmentListQuery Query) : IRequest<PaginatedList<LeaveEncashmentDto>>;

public sealed record ApproveLeaveEncashmentCommand(Guid Id, Guid ApprovedBy) : IRequest<LeaveEncashmentDto>;

public sealed record RejectLeaveEncashmentCommand(Guid Id, Guid RejectedBy) : IRequest<LeaveEncashmentDto>;

public sealed record MarkEncashmentPaidCommand(Guid Id) : IRequest<LeaveEncashmentDto>;

public sealed record GetDayTypeQuery(Guid CompanyId, Guid EmployeeId, DateOnly Date) : IRequest<DayTypeResponse>;

public sealed class CreateLeavePolicyCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, ILeaveCache cache) : IRequestHandler<CreateLeavePolicyCommand, LeavePolicyDto>
{
    public async Task<LeavePolicyDto> Handle(CreateLeavePolicyCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        _ = await uow.LeaveTypes.GetByIdAsync(r.LeaveTypeId, cancellationToken) ?? throw new LeaveBusinessException("Leave type not found.");
        var entity = new LeavePolicy
        {
            Id = Guid.NewGuid(),
            CompanyId = r.CompanyId,
            LeaveTypeId = r.LeaveTypeId,
            YearlyEntitlement = r.YearlyEntitlement,
            MonthlyAccrual = r.MonthlyAccrual,
            MinServiceMonths = r.MinServiceMonths,
            MaxConsecutiveDays = r.MaxConsecutiveDays,
            RequiresApproval = r.RequiresApproval,
            AllowHalfDay = r.AllowHalfDay,
            AllowNegativeBalance = r.AllowNegativeBalance,
            ExcludeHolidaysFromLeaveDays = r.ExcludeHolidaysFromLeaveDays,
            ExcludeWeeklyOffFromLeaveDays = r.ExcludeWeeklyOffFromLeaveDays,
            ApprovalLevelCount = Math.Max(1, r.ApprovalLevelCount),
            IsActive = true,
            CreatedAt = BusinessTime.Now,
        };
        uow.LeavePolicies.Add(entity);
        await audit.WriteAsync(r.CompanyId, null, "LeavePolicyCreated", nameof(LeavePolicy), entity.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync($"leavePolicies:{r.CompanyId}", cancellationToken);
        var reloaded = await uow.LeavePolicies.GetByIdAsync(entity.Id, cancellationToken);
        return mapper.Map<LeavePolicyDto>(reloaded!);
    }
}

public sealed class UpdateLeavePolicyCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, ILeaveCache cache) : IRequestHandler<UpdateLeavePolicyCommand, LeavePolicyDto>
{
    public async Task<LeavePolicyDto> Handle(UpdateLeavePolicyCommand request, CancellationToken cancellationToken)
    {
        var entity = await uow.LeavePolicies.GetByIdAsync(request.Id, cancellationToken) ?? throw new LeaveBusinessException("Policy not found.");
        var r = request.Request;
        entity.YearlyEntitlement = r.YearlyEntitlement;
        entity.MonthlyAccrual = r.MonthlyAccrual;
        entity.MinServiceMonths = r.MinServiceMonths;
        entity.MaxConsecutiveDays = r.MaxConsecutiveDays;
        entity.RequiresApproval = r.RequiresApproval;
        entity.AllowHalfDay = r.AllowHalfDay;
        entity.AllowNegativeBalance = r.AllowNegativeBalance;
        entity.ExcludeHolidaysFromLeaveDays = r.ExcludeHolidaysFromLeaveDays;
        entity.ExcludeWeeklyOffFromLeaveDays = r.ExcludeWeeklyOffFromLeaveDays;
        entity.ApprovalLevelCount = Math.Max(1, r.ApprovalLevelCount);
        entity.IsActive = r.IsActive;
        entity.UpdatedAt = BusinessTime.Now;
        await audit.WriteAsync(entity.CompanyId, null, "LeavePolicyUpdated", nameof(LeavePolicy), entity.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync($"leavePolicies:{entity.CompanyId}", cancellationToken);
        return mapper.Map<LeavePolicyDto>(entity);
    }
}

public sealed class GetLeavePoliciesQueryHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveCache cache) : IRequestHandler<GetLeavePoliciesQuery, IReadOnlyList<LeavePolicyDto>>
{
    public async Task<IReadOnlyList<LeavePolicyDto>> Handle(GetLeavePoliciesQuery request, CancellationToken cancellationToken)
    {
        var data = await cache.GetOrCreateAsync($"leavePolicies:{request.CompanyId}", TimeSpan.FromHours(6), async ct =>
        {
            var list = await uow.LeavePolicies.ListByCompanyAsync(request.CompanyId, ct);
            return list.Select(x => mapper.Map<LeavePolicyDto>(x)).ToList();
        }, cancellationToken);
        return data == null ? Array.Empty<LeavePolicyDto>() : data;
    }
}

public sealed class GenerateYearlyBalancesCommandHandler(ILeaveUnitOfWork uow, IEmployeeServiceClient employees, ILeaveAuditService audit, IIntegrationMessagePublisher bus) : IRequestHandler<GenerateYearlyBalancesCommand, int>
{
    public async Task<int> Handle(GenerateYearlyBalancesCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        var employeeIds = await employees.GetActiveEmployeeIdsAsync(r.CompanyId, cancellationToken);
        var policies = await uow.LeavePolicies.ListByCompanyAsync(r.CompanyId, cancellationToken);
        var activePolicies = policies.Where(p => p.IsActive).ToList();
        var existingKeys = await uow.EmployeeLeaveBalances.GetExistingBalanceKeysAsync(
            r.CompanyId,
            r.YearNo,
            cancellationToken);
        var count = 0;
        foreach (var emp in employeeIds)
        {
            foreach (var p in activePolicies)
            {
                if (existingKeys.Contains((emp, p.LeaveTypeId)))
                {
                    continue;
                }

                uow.EmployeeLeaveBalances.Add(new EmployeeLeaveBalance
                {
                    Id = Guid.NewGuid(),
                    CompanyId = r.CompanyId,
                    EmployeeId = emp,
                    LeaveTypeId = p.LeaveTypeId,
                    YearNo = r.YearNo,
                    OpeningBalance = 0,
                    EntitledDays = p.YearlyEntitlement,
                    AccruedDays = 0,
                    UsedDays = 0,
                    PendingDays = 0,
                    EncashDays = 0,
                    CarryForwardDays = 0,
                    BalanceDays = p.YearlyEntitlement,
                    UpdatedAt = BusinessTime.Now,
                });
                count++;
            }
        }

        await audit.WriteAsync(r.CompanyId, r.TriggeredBy, "YearlyBalancesGenerated", "EmployeeLeaveBalance", null, $"Count={count}", cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await bus.PublishJsonAsync(EventTypes.LeaveBalanceUpdated, new { eventName = "LeaveBalanceUpdated", companyId = r.CompanyId, year = r.YearNo }, cancellationToken);
        return count;
    }
}

public sealed class AccrueMonthlyBalancesCommandHandler(ILeaveUnitOfWork uow, ILeaveAuditService audit, IIntegrationMessagePublisher bus) : IRequestHandler<AccrueMonthlyBalancesCommand, int>
{
    public async Task<int> Handle(AccrueMonthlyBalancesCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        var policies = (await uow.LeavePolicies.ListByCompanyAsync(r.CompanyId, cancellationToken)).Where(x => x.IsActive && x.MonthlyAccrual > 0).ToDictionary(x => x.LeaveTypeId);
        var balances = await uow.EmployeeLeaveBalances.ListByCompanyYearAsync(r.CompanyId, r.YearNo, cancellationToken);
        var count = 0;
        foreach (var b in balances)
        {
            if (!policies.TryGetValue(b.LeaveTypeId, out var p))
            {
                continue;
            }

            b.AccruedDays += p.MonthlyAccrual;
            b.BalanceDays += p.MonthlyAccrual;
            b.UpdatedAt = BusinessTime.Now;
            count++;
        }

        await audit.WriteAsync(r.CompanyId, r.TriggeredBy, "MonthlyAccrualApplied", "EmployeeLeaveBalance", null, $"Rows={count}", cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await bus.PublishJsonAsync(EventTypes.LeaveBalanceUpdated, new { eventName = "LeaveBalanceUpdated", companyId = r.CompanyId, year = r.YearNo, month = r.Month }, cancellationToken);
        return count;
    }
}

public sealed class GetEmployeeLeaveBalancesQueryHandler(ILeaveUnitOfWork uow, IMapper mapper) : IRequestHandler<GetEmployeeLeaveBalancesQuery, IReadOnlyList<EmployeeLeaveBalanceDto>>
{
    public async Task<IReadOnlyList<EmployeeLeaveBalanceDto>> Handle(GetEmployeeLeaveBalancesQuery request, CancellationToken cancellationToken)
    {
        var list = await uow.EmployeeLeaveBalances.ListByEmployeeYearAsync(request.CompanyId, request.EmployeeId, request.Year, cancellationToken);
        return list.Select(x => mapper.Map<EmployeeLeaveBalanceDto>(x)).ToList();
    }
}

public sealed class AdjustLeaveBalanceCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, IIntegrationMessagePublisher bus) : IRequestHandler<AdjustLeaveBalanceCommand, EmployeeLeaveBalanceDto>
{
    public async Task<EmployeeLeaveBalanceDto> Handle(AdjustLeaveBalanceCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        var b = await uow.EmployeeLeaveBalances.GetAsync(r.CompanyId, r.EmployeeId, r.LeaveTypeId, r.YearNo, cancellationToken)
                ?? throw new LeaveBusinessException("Balance row not found.");
        b.BalanceDays += r.AdjustmentDays;
        b.UpdatedAt = BusinessTime.Now;
        uow.LeaveTransactions.Add(new LeaveTransaction
        {
            Id = Guid.NewGuid(),
            CompanyId = r.CompanyId,
            EmployeeId = r.EmployeeId,
            LeaveTypeId = r.LeaveTypeId,
            LeaveApplicationId = null,
            TransactionDate = BusinessTime.Now,
            TransactionType = "Adjustment",
            Days = r.AdjustmentDays,
            YearNo = r.YearNo,
            Remarks = r.Remarks,
        });
        await audit.WriteAsync(r.CompanyId, request.AdjustedBy, "LeaveBalanceAdjusted", nameof(EmployeeLeaveBalance), b.Id, r.Remarks, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await bus.PublishJsonAsync(EventTypes.LeaveBalanceAdjusted, new { companyId = r.CompanyId, employeeId = r.EmployeeId, leaveTypeId = r.LeaveTypeId, year = r.YearNo, adjustment = r.AdjustmentDays }, cancellationToken);
        return mapper.Map<EmployeeLeaveBalanceDto>(b);
    }
}

public sealed class CreateHolidayCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, IIntegrationMessagePublisher bus, ILeaveCache cache) : IRequestHandler<CreateHolidayCommand, HolidayDto>
{
    public async Task<HolidayDto> Handle(CreateHolidayCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        if (await uow.Holidays.GetByCompanyAndDateAsync(r.CompanyId, r.HolidayDate, cancellationToken) != null)
        {
            throw new LeaveBusinessException("Holiday date already exists for company.");
        }

        var h = new Holiday
        {
            Id = Guid.NewGuid(),
            CompanyId = r.CompanyId,
            HolidayDate = r.HolidayDate,
            HolidayName = r.HolidayName.Trim(),
            HolidayType = r.HolidayType,
            IsPaid = r.IsPaid,
            IsActive = r.IsActive,
            CreatedAt = BusinessTime.Now,
        };
        uow.Holidays.Add(h);
        await audit.WriteAsync(r.CompanyId, null, "HolidayCreated", nameof(Holiday), h.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await bus.PublishJsonAsync(EventTypes.HolidayCreated, new { eventName = "HolidayCreated", companyId = r.CompanyId, holidayId = h.Id }, cancellationToken);
        await cache.RemoveByPrefixAsync($"holidays:{r.CompanyId}:{r.HolidayDate.Year}", cancellationToken);
        return mapper.Map<HolidayDto>(h);
    }
}

public sealed class UpdateHolidayCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, ILeaveCache cache) : IRequestHandler<UpdateHolidayCommand, HolidayDto>
{
    public async Task<HolidayDto> Handle(UpdateHolidayCommand request, CancellationToken cancellationToken)
    {
        var h = await uow.Holidays.GetByIdAsync(request.Id, cancellationToken) ?? throw new LeaveBusinessException("Holiday not found.");
        var r = request.Request;
        h.HolidayName = r.HolidayName.Trim();
        h.HolidayType = r.HolidayType;
        h.IsPaid = r.IsPaid;
        h.IsActive = r.IsActive;
        await audit.WriteAsync(h.CompanyId, null, "HolidayUpdated", nameof(Holiday), h.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync($"holidays:{h.CompanyId}:{h.HolidayDate.Year}", cancellationToken);
        return mapper.Map<HolidayDto>(h);
    }
}

public sealed class GetHolidaysQueryHandler(ILeaveUnitOfWork uow, IMapper mapper) : IRequestHandler<GetHolidaysQuery, PaginatedList<HolidayDto>>
{
    public async Task<PaginatedList<HolidayDto>> Handle(GetHolidaysQuery request, CancellationToken cancellationToken)
    {
        var q = request.Query;
        q.Normalize();

        var filter = new HolidayListFilter
        {
            CompanyId = q.CompanyId,
            Year = q.Year,
            Page = q.Page,
            PageSize = q.PageSize,
            GetAll = q.GetAll,
        };

        var (items, total) = await uow.Holidays.ListByCompanyYearPagedAsync(filter, cancellationToken);
        var data = items.Select(x => mapper.Map<HolidayDto>(x)).ToList();
        var pagination = PaginationMetadata.Create(q.Page, q.PageSize, total, q.GetAll);
        return PaginatedList<HolidayDto>.From(data, pagination);
    }
}

public sealed class DeleteHolidayCommandHandler(ILeaveUnitOfWork uow, ILeaveAuditService audit, ILeaveCache cache) : IRequestHandler<DeleteHolidayCommand, Unit>
{
    public async Task<Unit> Handle(DeleteHolidayCommand request, CancellationToken cancellationToken)
    {
        var h = await uow.Holidays.GetByIdAsync(request.Id, cancellationToken) ?? throw new LeaveBusinessException("Holiday not found.");
        uow.Holidays.Remove(h);
        await audit.WriteAsync(h.CompanyId, null, "HolidayDeleted", nameof(Holiday), h.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync($"holidays:{h.CompanyId}:{h.HolidayDate.Year}", cancellationToken);
        return Unit.Value;
    }
}

public sealed class CreateWeeklyOffCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, IIntegrationMessagePublisher bus, ILeaveCache cache) : IRequestHandler<CreateWeeklyOffCommand, WeeklyOffDto>
{
    public async Task<WeeklyOffDto> Handle(CreateWeeklyOffCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        var day = r.DayOfWeekName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(day))
        {
            throw new LeaveBusinessException("Day of week is required.");
        }

        var existing = await uow.WeeklyOffRules.ListByCompanyAsync(r.CompanyId, cancellationToken);
        if (existing.Any(x => x.DayOfWeekName.Equals(day, StringComparison.OrdinalIgnoreCase)))
        {
            throw new LeaveBusinessException($"Weekly off for {day} is already assigned.");
        }

        var w = new WeeklyOffRule { Id = Guid.NewGuid(), CompanyId = r.CompanyId, DayOfWeekName = day, IsActive = true };
        uow.WeeklyOffRules.Add(w);
        await audit.WriteAsync(r.CompanyId, null, "WeeklyOffCreated", nameof(WeeklyOffRule), w.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await bus.PublishJsonAsync(EventTypes.WeeklyOffCreated, new { eventName = "WeeklyOffCreated", companyId = r.CompanyId, id = w.Id }, cancellationToken);
        await cache.RemoveByPrefixAsync($"weeklyOff:{r.CompanyId}", cancellationToken);
        return mapper.Map<WeeklyOffDto>(w);
    }
}

public sealed class GetWeeklyOffsQueryHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveCache cache) : IRequestHandler<GetWeeklyOffsQuery, IReadOnlyList<WeeklyOffDto>>
{
    public async Task<IReadOnlyList<WeeklyOffDto>> Handle(GetWeeklyOffsQuery request, CancellationToken cancellationToken)
    {
        var key = $"weeklyOff:{request.CompanyId}";
        var data = await cache.GetOrCreateAsync(key, TimeSpan.FromHours(12), async ct =>
        {
            var list = await uow.WeeklyOffRules.ListByCompanyAsync(request.CompanyId, ct);
            return list.Select(x => mapper.Map<WeeklyOffDto>(x)).ToList();
        }, cancellationToken);
        return data == null ? Array.Empty<WeeklyOffDto>() : data;
    }
}

public sealed class DeleteWeeklyOffCommandHandler(ILeaveUnitOfWork uow, ILeaveAuditService audit, ILeaveCache cache) : IRequestHandler<DeleteWeeklyOffCommand, Unit>
{
    public async Task<Unit> Handle(DeleteWeeklyOffCommand request, CancellationToken cancellationToken)
    {
        var w = await uow.WeeklyOffRules.GetByIdAsync(request.Id, cancellationToken) ?? throw new LeaveBusinessException("Weekly off not found.");
        uow.WeeklyOffRules.Remove(w);
        await audit.WriteAsync(w.CompanyId, null, "WeeklyOffDeleted", nameof(WeeklyOffRule), w.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveByPrefixAsync($"weeklyOff:{w.CompanyId}", cancellationToken);
        return Unit.Value;
    }
}

public sealed class GenerateEarnLeaveCommandHandler(ILeaveUnitOfWork uow, IAttendanceServiceClient attendance, ILeaveAuditService audit, IIntegrationMessagePublisher bus) : IRequestHandler<GenerateEarnLeaveCommand, EarnLeaveSummaryDto>
{
    public async Task<EarnLeaveSummaryDto> Handle(GenerateEarnLeaveCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        var policy = await uow.EarnLeavePolicies.GetActiveByCompanyAndLeaveTypeAsync(r.CompanyId, r.LeaveTypeId, cancellationToken)
                     ?? throw new LeaveBusinessException("Earn leave policy not found.");
        var working = await attendance.GetMonthlyApprovedWorkingDaysAsync(r.CompanyId, r.EmployeeId, r.YearNo, r.Month, cancellationToken);
        var divisor = policy.DaysWorkedForOneEarnLeave <= 0 ? 18m : policy.DaysWorkedForOneEarnLeave;
        var earned = working / divisor;
        var balance = await uow.EmployeeLeaveBalances.GetAsync(r.CompanyId, r.EmployeeId, r.LeaveTypeId, r.YearNo, cancellationToken)
                      ?? throw new LeaveBusinessException("Balance row not found.");
        if (policy.MaxEarnLeavePerYear > 0)
        {
            var room = policy.MaxEarnLeavePerYear - balance.AccruedDays;
            if (earned > room)
            {
                earned = Math.Max(0, room);
            }
        }

        balance.AccruedDays += earned;
        balance.BalanceDays += earned;
        balance.UpdatedAt = BusinessTime.Now;
        await audit.WriteAsync(r.CompanyId, null, "EarnLeaveGenerated", "EarnLeave", balance.Id, $"Earned={earned}", cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await bus.PublishJsonAsync(EventTypes.EarnLeaveGenerated, new { eventName = "EarnLeaveGenerated", companyId = r.CompanyId, employeeId = r.EmployeeId, leaveTypeId = r.LeaveTypeId, earned }, cancellationToken);
        return new EarnLeaveSummaryDto(r.EmployeeId, r.YearNo, r.Month, earned, balance.AccruedDays);
    }
}

public sealed class GetEarnLeaveSummaryQueryHandler(ILeaveUnitOfWork uow, IMapper mapper) : IRequestHandler<GetEarnLeaveSummaryQuery, IReadOnlyList<EmployeeLeaveBalanceDto>>
{
    public async Task<IReadOnlyList<EmployeeLeaveBalanceDto>> Handle(GetEarnLeaveSummaryQuery request, CancellationToken cancellationToken)
    {
        var list = await uow.EmployeeLeaveBalances.ListByEmployeeYearAsync(request.CompanyId, request.EmployeeId, request.Year, cancellationToken);
        return list.Select(x => mapper.Map<EmployeeLeaveBalanceDto>(x)).ToList();
    }
}

public sealed class CreateLeaveEncashmentCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit) : IRequestHandler<CreateLeaveEncashmentCommand, LeaveEncashmentDto>
{
    public async Task<LeaveEncashmentDto> Handle(CreateLeaveEncashmentCommand request, CancellationToken cancellationToken)
    {
        var r = request.Request;
        var balance = await uow.EmployeeLeaveBalances.GetAsync(r.CompanyId, r.EmployeeId, r.LeaveTypeId, r.YearNo, cancellationToken)
                      ?? throw new LeaveBusinessException("Balance row not found.");
        var available = balance.BalanceDays - balance.PendingDays;
        if (r.EncashDays > available)
        {
            throw new LeaveBusinessException("Encash days exceed available balance.");
        }

        var e = new LeaveEncashment
        {
            Id = Guid.NewGuid(),
            CompanyId = r.CompanyId,
            EmployeeId = r.EmployeeId,
            LeaveTypeId = r.LeaveTypeId,
            YearNo = r.YearNo,
            EncashDays = r.EncashDays,
            RatePerDay = r.RatePerDay,
            TotalAmount = r.EncashDays * r.RatePerDay,
            Status = "Pending",
            RequestedBy = r.RequestedBy,
            CreatedAt = BusinessTime.Now,
        };
        uow.LeaveEncashments.Add(e);
        await audit.WriteAsync(r.CompanyId, r.RequestedBy, "LeaveEncashmentCreated", nameof(LeaveEncashment), e.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<LeaveEncashmentDto>(e);
    }
}

public sealed class GetLeaveEncashmentsQueryHandler(ILeaveUnitOfWork uow, IMapper mapper) : IRequestHandler<GetLeaveEncashmentsQuery, PaginatedList<LeaveEncashmentDto>>
{
    public async Task<PaginatedList<LeaveEncashmentDto>> Handle(GetLeaveEncashmentsQuery request, CancellationToken cancellationToken)
    {
        var q = request.Query;
        q.Normalize();

        var filter = new LeaveEncashmentListFilter
        {
            CompanyId = q.CompanyId,
            Year = q.Year,
            Page = q.Page,
            PageSize = q.PageSize,
            GetAll = q.GetAll,
        };

        var (items, total) = await uow.LeaveEncashments.ListByCompanyYearPagedAsync(filter, cancellationToken);
        var data = items.Select(x => mapper.Map<LeaveEncashmentDto>(x)).ToList();
        var pagination = PaginationMetadata.Create(q.Page, q.PageSize, total, q.GetAll);
        return PaginatedList<LeaveEncashmentDto>.From(data, pagination);
    }
}

public sealed class ApproveLeaveEncashmentCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit, IIntegrationMessagePublisher bus) : IRequestHandler<ApproveLeaveEncashmentCommand, LeaveEncashmentDto>
{
    public async Task<LeaveEncashmentDto> Handle(ApproveLeaveEncashmentCommand request, CancellationToken cancellationToken)
    {
        var e = await uow.LeaveEncashments.GetByIdAsync(request.Id, cancellationToken) ?? throw new LeaveBusinessException("Encashment not found.");
        if (e.Status != "Pending")
        {
            throw new LeaveBusinessException("Invalid encashment status.");
        }

        var b = await uow.EmployeeLeaveBalances.GetAsync(e.CompanyId, e.EmployeeId, e.LeaveTypeId, e.YearNo, cancellationToken)
                ?? throw new LeaveBusinessException("Balance row not found.");
        if (b.BalanceDays - b.PendingDays < e.EncashDays)
        {
            throw new LeaveBusinessException("Insufficient balance for encashment approval.");
        }

        b.BalanceDays -= e.EncashDays;
        b.EncashDays += e.EncashDays;
        b.UpdatedAt = BusinessTime.Now;
        e.Status = "Approved";
        e.ApprovedBy = request.ApprovedBy;
        e.ApprovedAt = BusinessTime.Now;
        uow.LeaveTransactions.Add(new LeaveTransaction
        {
            Id = Guid.NewGuid(),
            CompanyId = e.CompanyId,
            EmployeeId = e.EmployeeId,
            LeaveTypeId = e.LeaveTypeId,
            LeaveApplicationId = null,
            TransactionDate = BusinessTime.Now,
            TransactionType = "Encash",
            Days = e.EncashDays,
            YearNo = e.YearNo,
            Remarks = "Encashment approved",
        });
        await audit.WriteAsync(e.CompanyId, request.ApprovedBy, "LeaveEncashmentApproved", nameof(LeaveEncashment), e.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await bus.PublishJsonAsync(EventTypes.LeaveEncashmentApproved, new
        {
            eventName = "LeaveEncashmentApproved",
            companyId = e.CompanyId,
            employeeId = e.EmployeeId,
            leaveTypeId = e.LeaveTypeId,
            encashDays = e.EncashDays,
            totalAmount = e.TotalAmount,
        }, cancellationToken);
        return mapper.Map<LeaveEncashmentDto>(e);
    }
}

public sealed class RejectLeaveEncashmentCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit) : IRequestHandler<RejectLeaveEncashmentCommand, LeaveEncashmentDto>
{
    public async Task<LeaveEncashmentDto> Handle(RejectLeaveEncashmentCommand request, CancellationToken cancellationToken)
    {
        var e = await uow.LeaveEncashments.GetByIdAsync(request.Id, cancellationToken) ?? throw new LeaveBusinessException("Encashment not found.");
        e.Status = "Rejected";
        await audit.WriteAsync(e.CompanyId, request.RejectedBy, "LeaveEncashmentRejected", nameof(LeaveEncashment), e.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<LeaveEncashmentDto>(e);
    }
}

public sealed class MarkEncashmentPaidCommandHandler(ILeaveUnitOfWork uow, IMapper mapper, ILeaveAuditService audit) : IRequestHandler<MarkEncashmentPaidCommand, LeaveEncashmentDto>
{
    public async Task<LeaveEncashmentDto> Handle(MarkEncashmentPaidCommand request, CancellationToken cancellationToken)
    {
        var e = await uow.LeaveEncashments.GetByIdAsync(request.Id, cancellationToken) ?? throw new LeaveBusinessException("Encashment not found.");
        if (e.Status != "Approved")
        {
            throw new LeaveBusinessException("Encashment must be approved before paid.");
        }

        e.Status = "Paid";
        await audit.WriteAsync(e.CompanyId, null, "LeaveEncashmentPaid", nameof(LeaveEncashment), e.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<LeaveEncashmentDto>(e);
    }
}

public sealed class GetDayTypeQueryHandler(ILeaveUnitOfWork uow) : IRequestHandler<GetDayTypeQuery, DayTypeResponse>
{
    public async Task<DayTypeResponse> Handle(GetDayTypeQuery request, CancellationToken cancellationToken)
    {
        var app = await uow.LeaveApplications.GetApprovedLeaveForDayAsync(request.CompanyId, request.EmployeeId, request.Date, cancellationToken);
        if (app?.LeaveType != null)
        {
            return app.LeaveType.IsPaid
                ? new DayTypeResponse(DayTypeKind.Leave, app.LeaveTypeId, app.LeaveType.LeaveCode, true)
                : new DayTypeResponse(DayTypeKind.LeaveWithoutPay, app.LeaveTypeId, app.LeaveType.LeaveCode, false);
        }

        if (await uow.Holidays.GetByCompanyAndDateAsync(request.CompanyId, request.Date, cancellationToken) is { IsActive: true })
        {
            return new DayTypeResponse(DayTypeKind.Holiday, null, null, false);
        }

        var dow = request.Date.ToDateTime(TimeOnly.MinValue).DayOfWeek.ToString();
        if (await uow.WeeklyOffRules.HasActiveWeeklyOffAsync(request.CompanyId, dow, cancellationToken))
        {
            return new DayTypeResponse(DayTypeKind.WeeklyOff, null, null, false);
        }

        return new DayTypeResponse(DayTypeKind.WorkingDay, null, null, false);
    }
}
