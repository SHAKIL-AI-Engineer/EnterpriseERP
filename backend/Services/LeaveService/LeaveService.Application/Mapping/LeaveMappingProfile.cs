using AutoMapper;
using LeaveService.Contracts.LeaveBalances;
using LeaveService.Contracts.LeaveEncashments;
using LeaveService.Contracts.LeavePolicies;
using LeaveService.Contracts.LeaveTypes;
using LeaveService.Contracts.LeaveApplications;
using LeaveService.Contracts.Holidays;
using LeaveService.Contracts.WeeklyOffs;
using LeaveService.Domain.Entities;

namespace LeaveService.Application.Mapping;

public sealed class LeaveMappingProfile : Profile
{
    public LeaveMappingProfile()
    {
        CreateMap<LeaveType, LeaveTypeDto>().ConvertUsing(static s => new LeaveTypeDto(s.Id, s.CompanyId, s.LeaveCode, s.LeaveName, s.IsPaid, s.IsCarryForward, s.MaxCarryForwardDays, s.IsEncashable, s.IsActive, s.CreatedAt));
        CreateMap<LeavePolicy, LeavePolicyDto>().ConvertUsing(static p => new LeavePolicyDto(p.Id, p.CompanyId, p.LeaveTypeId, p.LeaveType == null ? null : p.LeaveType.LeaveCode, p.YearlyEntitlement, p.MonthlyAccrual, p.MinServiceMonths, p.MaxConsecutiveDays, p.RequiresApproval, p.AllowHalfDay, p.AllowNegativeBalance, p.ExcludeHolidaysFromLeaveDays, p.ExcludeWeeklyOffFromLeaveDays, p.ApprovalLevelCount, p.IsActive));
        CreateMap<EmployeeLeaveBalance, EmployeeLeaveBalanceDto>().ConvertUsing(static b => new EmployeeLeaveBalanceDto(b.Id, b.LeaveTypeId, b.LeaveType == null ? null : b.LeaveType.LeaveCode, b.LeaveType == null ? null : b.LeaveType.LeaveName, b.YearNo, b.OpeningBalance, b.EntitledDays, b.AccruedDays, b.UsedDays, b.PendingDays, b.EncashDays, b.CarryForwardDays, b.BalanceDays));
        CreateMap<Holiday, HolidayDto>().ConvertUsing(static h => new HolidayDto(h.Id, h.CompanyId, h.HolidayDate, h.HolidayName, h.HolidayType, h.IsPaid, h.IsActive, h.CreatedAt));
        CreateMap<WeeklyOffRule, WeeklyOffDto>().ConvertUsing(static w => new WeeklyOffDto(w.Id, w.CompanyId, w.DayOfWeekName, w.IsActive));
        CreateMap<LeaveEncashment, LeaveEncashmentDto>().ConvertUsing(static e => new LeaveEncashmentDto(e.Id, e.CompanyId, e.EmployeeId, e.LeaveTypeId, e.YearNo, e.EncashDays, e.RatePerDay, e.TotalAmount, e.Status, e.RequestedBy, e.ApprovedBy, e.ApprovedAt, e.CreatedAt));
        CreateMap<LeaveApprovalStep, LeaveApprovalStepDto>().ConvertUsing(static s => new LeaveApprovalStepDto(s.Id, s.ApprovalLevel, s.ApproverUserId, s.ApproverEmployeeId, s.Status, s.Remarks, s.ActionAt));
    }
}
