using LeaveService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace LeaveService.Infrastructure.Persistence;

public static class LeaveDataSeeder
{
    private static readonly Guid DemoCompany = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid DemoEmployee = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public static async Task SeedAsync(LeaveDbContext db)
    {
        if (await db.LeaveTypes.AnyAsync())
        {
            return;
        }

        var cl = new LeaveType
        {
            Id = Guid.NewGuid(),
            CompanyId = DemoCompany,
            LeaveCode = "CL",
            LeaveName = "Casual Leave",
            IsPaid = true,
            IsCarryForward = false,
            MaxCarryForwardDays = 0,
            IsEncashable = false,
            IsActive = true,
            CreatedAt = BusinessTime.Now,
        };
        var sl = new LeaveType
        {
            Id = Guid.NewGuid(),
            CompanyId = DemoCompany,
            LeaveCode = "SL",
            LeaveName = "Sick Leave",
            IsPaid = true,
            IsCarryForward = true,
            MaxCarryForwardDays = 5,
            IsEncashable = false,
            IsActive = true,
            CreatedAt = BusinessTime.Now,
        };
        var lwp = new LeaveType
        {
            Id = Guid.NewGuid(),
            CompanyId = DemoCompany,
            LeaveCode = "LWP",
            LeaveName = "Leave Without Pay",
            IsPaid = false,
            IsCarryForward = false,
            MaxCarryForwardDays = 0,
            IsEncashable = false,
            IsActive = true,
            CreatedAt = BusinessTime.Now,
        };
        db.LeaveTypes.AddRange(cl, sl, lwp);

        var policy = new LeavePolicy
        {
            Id = Guid.NewGuid(),
            CompanyId = DemoCompany,
            LeaveTypeId = cl.Id,
            YearlyEntitlement = 10,
            MonthlyAccrual = 0,
            MinServiceMonths = 0,
            MaxConsecutiveDays = 5,
            RequiresApproval = true,
            AllowHalfDay = true,
            AllowNegativeBalance = false,
            ExcludeHolidaysFromLeaveDays = true,
            ExcludeWeeklyOffFromLeaveDays = true,
            ApprovalLevelCount = 2,
            IsActive = true,
            CreatedAt = BusinessTime.Now,
        };
        db.LeavePolicies.Add(policy);

        db.EmployeeLeaveBalances.Add(new EmployeeLeaveBalance
        {
            Id = Guid.NewGuid(),
            CompanyId = DemoCompany,
            EmployeeId = DemoEmployee,
            LeaveTypeId = cl.Id,
            YearNo = BusinessTime.Now.Year,
            OpeningBalance = 0,
            EntitledDays = 10,
            AccruedDays = 0,
            UsedDays = 0,
            PendingDays = 0,
            EncashDays = 0,
            CarryForwardDays = 0,
            BalanceDays = 10,
            UpdatedAt = BusinessTime.Now,
        });

        db.Holidays.Add(new Holiday
        {
            Id = Guid.NewGuid(),
            CompanyId = DemoCompany,
            HolidayDate = new DateOnly(BusinessTime.Now.Year, 1, 1),
            HolidayName = "New Year",
            HolidayType = "Government",
            IsPaid = true,
            IsActive = true,
            CreatedAt = BusinessTime.Now,
        });

        db.WeeklyOffRules.Add(new WeeklyOffRule { Id = Guid.NewGuid(), CompanyId = DemoCompany, DayOfWeekName = "Sunday", IsActive = true });

        db.EarnLeavePolicies.Add(new EarnLeavePolicy
        {
            Id = Guid.NewGuid(),
            CompanyId = DemoCompany,
            LeaveTypeId = sl.Id,
            CalculationType = "WorkingDaysBased",
            DaysWorkedForOneEarnLeave = 18,
            MaxEarnLeavePerYear = 10,
            IsEncashable = true,
            IsCarryForward = true,
            IsActive = true,
        });

        await db.SaveChangesAsync();
    }
}
