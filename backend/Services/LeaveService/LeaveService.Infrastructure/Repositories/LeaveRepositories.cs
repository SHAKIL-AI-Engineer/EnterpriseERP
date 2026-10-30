using LeaveService.Application.Common.Interfaces;
using LeaveService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using LeaveService.Infrastructure.Persistence;

namespace LeaveService.Infrastructure.Repositories;

public sealed class LeaveUnitOfWork : ILeaveUnitOfWork
{
    private readonly LeaveDbContext _db;

    public LeaveUnitOfWork(LeaveDbContext db)
    {
        _db = db;
        LeaveTypes = new LeaveTypeRepository(db);
        LeavePolicies = new LeavePolicyRepository(db);
        EmployeeLeaveBalances = new EmployeeLeaveBalanceRepository(db);
        LeaveApplications = new LeaveApplicationRepository(db);
        LeaveApprovalSteps = new LeaveApprovalStepRepository(db);
        LeaveTransactions = new LeaveTransactionRepository(db);
        Holidays = new HolidayRepository(db);
        WeeklyOffRules = new WeeklyOffRuleRepository(db);
        EarnLeavePolicies = new EarnLeavePolicyRepository(db);
        LeaveEncashments = new LeaveEncashmentRepository(db);
        PayrollMonthLocks = new PayrollMonthLockRepository(db);
        AuditLogs = new LeaveAuditLogRepository(db);
    }

    public ILeaveTypeRepository LeaveTypes { get; }
    public ILeavePolicyRepository LeavePolicies { get; }
    public IEmployeeLeaveBalanceRepository EmployeeLeaveBalances { get; }
    public ILeaveApplicationRepository LeaveApplications { get; }
    public ILeaveApprovalStepRepository LeaveApprovalSteps { get; }
    public ILeaveTransactionRepository LeaveTransactions { get; }
    public IHolidayRepository Holidays { get; }
    public IWeeklyOffRuleRepository WeeklyOffRules { get; }
    public IEarnLeavePolicyRepository EarnLeavePolicies { get; }
    public ILeaveEncashmentRepository LeaveEncashments { get; }
    public IPayrollMonthLockRepository PayrollMonthLocks { get; }
    public ILeaveAuditLogRepository AuditLogs { get; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _db.SaveChangesAsync(cancellationToken);
}

internal sealed class LeaveTypeRepository(LeaveDbContext db) : ILeaveTypeRepository
{
    public Task<LeaveType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.LeaveTypes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<LeaveType?> GetByCompanyAndCodeAsync(Guid companyId, string leaveCode, CancellationToken cancellationToken = default) =>
        db.LeaveTypes.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.LeaveCode == leaveCode, cancellationToken);

    public async Task<IReadOnlyList<LeaveType>> ListByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        await db.LeaveTypes.AsNoTracking().Where(x => x.CompanyId == companyId).OrderBy(x => x.LeaveCode).ToListAsync(cancellationToken);

    public async Task<LeaveTypeUsageCounts> GetUsageCountsAsync(Guid leaveTypeId, CancellationToken cancellationToken = default)
    {
        var applications = await db.LeaveApplications.CountAsync(x => x.LeaveTypeId == leaveTypeId, cancellationToken);
        var balances = await db.EmployeeLeaveBalances.CountAsync(x => x.LeaveTypeId == leaveTypeId, cancellationToken);
        var encashments = await db.LeaveEncashments.CountAsync(x => x.LeaveTypeId == leaveTypeId, cancellationToken);
        var earnPolicies = await db.EarnLeavePolicies.CountAsync(x => x.LeaveTypeId == leaveTypeId, cancellationToken);
        return new LeaveTypeUsageCounts(applications, balances, encashments, earnPolicies);
    }

    public void Add(LeaveType entity) => db.LeaveTypes.Add(entity);

    public void Remove(LeaveType entity) => db.LeaveTypes.Remove(entity);
}

internal sealed class LeavePolicyRepository(LeaveDbContext db) : ILeavePolicyRepository
{
    public Task<LeavePolicy?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.LeavePolicies.Include(x => x.LeaveType).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<LeavePolicy?> GetActiveByCompanyAndLeaveTypeAsync(Guid companyId, Guid leaveTypeId, CancellationToken cancellationToken = default) =>
        db.LeavePolicies.AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.LeaveTypeId == leaveTypeId && x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<LeavePolicy>> ListByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        await db.LeavePolicies.AsNoTracking().Include(x => x.LeaveType)
            .Where(x => x.CompanyId == companyId).OrderBy(x => x.LeaveType!.LeaveCode).ToListAsync(cancellationToken);

    public void Add(LeavePolicy entity) => db.LeavePolicies.Add(entity);
}

internal sealed class EmployeeLeaveBalanceRepository(LeaveDbContext db) : IEmployeeLeaveBalanceRepository
{
    public Task<EmployeeLeaveBalance?> GetAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, CancellationToken cancellationToken = default) =>
        db.EmployeeLeaveBalances.FirstOrDefaultAsync(x =>
            x.CompanyId == companyId && x.EmployeeId == employeeId && x.LeaveTypeId == leaveTypeId && x.YearNo == yearNo, cancellationToken);

    public async Task<IReadOnlyList<EmployeeLeaveBalance>> ListByEmployeeYearAsync(Guid companyId, Guid employeeId, int yearNo, CancellationToken cancellationToken = default) =>
        await db.EmployeeLeaveBalances.AsNoTracking().Include(x => x.LeaveType)
            .Where(x => x.CompanyId == companyId && x.EmployeeId == employeeId && x.YearNo == yearNo)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<EmployeeLeaveBalance>> ListByCompanyYearAsync(Guid companyId, int yearNo, CancellationToken cancellationToken = default) =>
        await db.EmployeeLeaveBalances.Include(x => x.LeaveType)
            .Where(x => x.CompanyId == companyId && x.YearNo == yearNo)
            .ToListAsync(cancellationToken);

    public async Task<HashSet<(Guid EmployeeId, Guid LeaveTypeId)>> GetExistingBalanceKeysAsync(
        Guid companyId,
        int yearNo,
        CancellationToken cancellationToken = default)
    {
        var keys = await db.EmployeeLeaveBalances.AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.YearNo == yearNo)
            .Select(x => new { x.EmployeeId, x.LeaveTypeId })
            .ToListAsync(cancellationToken);
        return keys.Select(x => (x.EmployeeId, x.LeaveTypeId)).ToHashSet();
    }

    public void Add(EmployeeLeaveBalance entity) => db.EmployeeLeaveBalances.Add(entity);
}

internal sealed class LeaveApplicationRepository(LeaveDbContext db) : ILeaveApplicationRepository
{
    public Task<LeaveApplication?> GetWithStepsAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.LeaveApplications.Include(x => x.LeaveType).Include(x => x.ApprovalSteps.OrderBy(s => s.ApprovalLevel))
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<LeaveApplication>> ListByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        await db.LeaveApplications.AsNoTracking().Include(x => x.LeaveType)
            .Where(x => x.CompanyId == companyId).OrderByDescending(x => x.AppliedAt).ToListAsync(cancellationToken);

    public async Task<(IReadOnlyList<LeaveApplication> Items, int TotalCount)> ListByCompanyPagedAsync(
        LeaveApplicationListFilter filter,
        CancellationToken cancellationToken = default)
    {
        var q = db.LeaveApplications.AsNoTracking()
            .Include(x => x.LeaveType)
            .Where(x => x.CompanyId == filter.CompanyId);

        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            !string.Equals(filter.Status, "all", StringComparison.OrdinalIgnoreCase))
        {
            q = q.Where(x => x.Status == filter.Status);
        }

        if (filter.EmployeeId.HasValue)
            q = q.Where(x => x.EmployeeId == filter.EmployeeId);

        if (filter.FromDate.HasValue)
            q = q.Where(x => x.ToDate >= filter.FromDate);

        if (filter.ToDate.HasValue)
            q = q.Where(x => x.FromDate <= filter.ToDate);

        var total = await q.CountAsync(cancellationToken);
        var ordered = q.OrderByDescending(x => x.AppliedAt);
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 50 : filter.PageSize;

        var items = filter.GetAll
            ? await ordered.ToListAsync(cancellationToken)
            : await ordered.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<bool> HasOverlappingPendingOrApprovedAsync(Guid companyId, Guid employeeId, DateOnly from, DateOnly to, Guid? excludeApplicationId, CancellationToken cancellationToken = default) =>
        db.LeaveApplications.AnyAsync(a =>
                a.CompanyId == companyId && a.EmployeeId == employeeId
                                          && (a.Status == "Pending" || a.Status == "Approved")
                                          && a.FromDate <= to && a.ToDate >= from
                                          && (excludeApplicationId == null || a.Id != excludeApplicationId),
            cancellationToken);

    public Task<LeaveApplication?> GetApprovedLeaveForDayAsync(Guid companyId, Guid employeeId, DateOnly date, CancellationToken cancellationToken = default) =>
        db.LeaveApplications.Include(x => x.LeaveType)
            .Where(a => a.CompanyId == companyId && a.EmployeeId == employeeId && a.Status == "Approved"
                                                                           && a.FromDate <= date && a.ToDate >= date)
            .FirstOrDefaultAsync(cancellationToken);

    public void Add(LeaveApplication entity) => db.LeaveApplications.Add(entity);
}

internal sealed class LeaveApprovalStepRepository(LeaveDbContext db) : ILeaveApprovalStepRepository
{
    public void AddRange(IEnumerable<LeaveApprovalStep> steps) => db.LeaveApprovalSteps.AddRange(steps);
}

internal sealed class LeaveTransactionRepository(LeaveDbContext db) : ILeaveTransactionRepository
{
    public void Add(LeaveTransaction entity) => db.LeaveTransactions.Add(entity);
}

internal sealed class HolidayRepository(LeaveDbContext db) : IHolidayRepository
{
    public Task<Holiday?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Holidays.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Holiday?> GetByCompanyAndDateAsync(Guid companyId, DateOnly date, CancellationToken cancellationToken = default) =>
        db.Holidays.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.HolidayDate == date && x.IsActive, cancellationToken);

    public async Task<IReadOnlyList<Holiday>> ListByCompanyYearAsync(Guid companyId, int year, CancellationToken cancellationToken = default) =>
        await db.Holidays.AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.HolidayDate.Year == year && x.IsActive)
            .OrderBy(x => x.HolidayDate).ToListAsync(cancellationToken);

    public async Task<(IReadOnlyList<Holiday> Items, int TotalCount)> ListByCompanyYearPagedAsync(
        HolidayListFilter filter,
        CancellationToken cancellationToken = default)
    {
        var q = db.Holidays.AsNoTracking()
            .Where(x => x.CompanyId == filter.CompanyId && x.HolidayDate.Year == filter.Year && x.IsActive);

        var total = await q.CountAsync(cancellationToken);
        var ordered = q.OrderBy(x => x.HolidayDate);
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 50 : filter.PageSize;

        var items = filter.GetAll
            ? await ordered.ToListAsync(cancellationToken)
            : await ordered.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyList<Holiday>> ListActiveBetweenAsync(Guid companyId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default) =>
        await db.Holidays.AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.IsActive && x.HolidayDate >= from && x.HolidayDate <= to)
            .ToListAsync(cancellationToken);

    public void Add(Holiday entity) => db.Holidays.Add(entity);
    public void Remove(Holiday entity) => db.Holidays.Remove(entity);
}

internal sealed class WeeklyOffRuleRepository(LeaveDbContext db) : IWeeklyOffRuleRepository
{
    public async Task<IReadOnlyList<WeeklyOffRule>> ListByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        await db.WeeklyOffRules.AsNoTracking().Where(x => x.CompanyId == companyId && x.IsActive).ToListAsync(cancellationToken);

    public Task<bool> HasActiveWeeklyOffAsync(Guid companyId, string dayOfWeekName, CancellationToken cancellationToken = default) =>
        db.WeeklyOffRules.AsNoTracking().AnyAsync(
            x => x.CompanyId == companyId && x.IsActive &&
                 x.DayOfWeekName == dayOfWeekName,
            cancellationToken);

    public Task<WeeklyOffRule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.WeeklyOffRules.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public void Add(WeeklyOffRule entity) => db.WeeklyOffRules.Add(entity);
    public void Remove(WeeklyOffRule entity) => db.WeeklyOffRules.Remove(entity);
}

internal sealed class EarnLeavePolicyRepository(LeaveDbContext db) : IEarnLeavePolicyRepository
{
    public Task<EarnLeavePolicy?> GetActiveByCompanyAndLeaveTypeAsync(Guid companyId, Guid leaveTypeId, CancellationToken cancellationToken = default) =>
        db.EarnLeavePolicies.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.LeaveTypeId == leaveTypeId && x.IsActive, cancellationToken);

    public async Task<IReadOnlyList<EarnLeavePolicy>> ListActiveByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        await db.EarnLeavePolicies.AsNoTracking().Include(x => x.LeaveType).Where(x => x.CompanyId == companyId && x.IsActive).ToListAsync(cancellationToken);

    public void Add(EarnLeavePolicy entity) => db.EarnLeavePolicies.Add(entity);
}

internal sealed class LeaveEncashmentRepository(LeaveDbContext db) : ILeaveEncashmentRepository
{
    public Task<LeaveEncashment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.LeaveEncashments.Include(x => x.LeaveType).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<LeaveEncashment>> ListByCompanyYearAsync(Guid companyId, int? year, CancellationToken cancellationToken = default)
    {
        IQueryable<LeaveEncashment> q = db.LeaveEncashments.AsNoTracking().Include(x => x.LeaveType).Where(x => x.CompanyId == companyId);
        if (year.HasValue)
        {
            q = q.Where(x => x.YearNo == year.Value);
        }

        return await q.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<LeaveEncashment> Items, int TotalCount)> ListByCompanyYearPagedAsync(
        LeaveEncashmentListFilter filter,
        CancellationToken cancellationToken = default)
    {
        IQueryable<LeaveEncashment> q = db.LeaveEncashments.AsNoTracking()
            .Include(x => x.LeaveType)
            .Where(x => x.CompanyId == filter.CompanyId);

        if (filter.Year.HasValue)
            q = q.Where(x => x.YearNo == filter.Year.Value);

        var total = await q.CountAsync(cancellationToken);
        var ordered = q.OrderByDescending(x => x.CreatedAt);
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 50 : filter.PageSize;

        var items = filter.GetAll
            ? await ordered.ToListAsync(cancellationToken)
            : await ordered.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

        return (items, total);
    }

    public void Add(LeaveEncashment entity) => db.LeaveEncashments.Add(entity);
}

internal sealed class PayrollMonthLockRepository(LeaveDbContext db) : IPayrollMonthLockRepository
{
    public Task<PayrollMonthLock?> GetAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default) =>
        db.PayrollMonthLocks.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.Year == year && x.Month == month, cancellationToken);

    public async Task UpsertAsync(PayrollMonthLock entity, CancellationToken cancellationToken = default)
    {
        var existing = await db.PayrollMonthLocks.FirstOrDefaultAsync(x =>
            x.CompanyId == entity.CompanyId && x.Year == entity.Year && x.Month == entity.Month, cancellationToken);
        if (existing == null)
        {
            db.PayrollMonthLocks.Add(entity);
        }
        else
        {
            existing.IsLocked = entity.IsLocked;
            existing.UpdatedAt = entity.UpdatedAt;
        }
    }
}

internal sealed class LeaveAuditLogRepository(LeaveDbContext db) : ILeaveAuditLogRepository
{
    public async Task<IReadOnlyList<LeaveAuditLog>> ListRecentAsync(Guid? companyId, int take, CancellationToken cancellationToken = default)
    {
        var q = db.LeaveAuditLogs.AsNoTracking().OrderByDescending(x => x.CreatedAt).AsQueryable();
        if (companyId.HasValue)
        {
            q = q.Where(x => x.CompanyId == companyId);
        }

        return await q.Take(take).ToListAsync(cancellationToken);
    }

    public void Add(LeaveAuditLog log) => db.LeaveAuditLogs.Add(log);
}
