namespace LeaveService.Contracts.EarnLeaves;

public sealed record GenerateEarnLeaveRequest(Guid CompanyId, Guid EmployeeId, Guid LeaveTypeId, int YearNo, int Month);

public sealed record EarnLeaveSummaryDto(Guid EmployeeId, int YearNo, int Month, decimal EarnedDays, decimal NewAccruedTotal);
