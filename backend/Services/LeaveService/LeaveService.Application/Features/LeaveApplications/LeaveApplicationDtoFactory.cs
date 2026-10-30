using LeaveService.Contracts.LeaveApplications;
using LeaveService.Domain.Entities;

namespace LeaveService.Application.Features.LeaveApplications;

public static class LeaveApplicationDtoFactory
{
    public static LeaveApplicationDto FromEntity(LeaveApplication a)
    {
        var steps = a.ApprovalSteps.OrderBy(s => s.ApprovalLevel)
            .Select(s => new LeaveApprovalStepDto(s.Id, s.ApprovalLevel, s.ApproverUserId, s.ApproverEmployeeId, s.Status, s.Remarks, s.ActionAt)).ToList();
        return new LeaveApplicationDto(a.Id, a.CompanyId, a.EmployeeId, a.LeaveTypeId, a.LeaveType?.LeaveCode, a.FromDate, a.ToDate, a.TotalDays, a.IsHalfDay, a.HalfDayType, a.Reason, a.Status, a.AppliedBy, a.AppliedAt, a.ApprovedAt, a.RejectedAt, a.CancelledAt, steps);
    }
}
