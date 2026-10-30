namespace LeaveService.Contracts.WeeklyOffs;

public sealed record WeeklyOffRequest(Guid CompanyId, string DayOfWeekName);

public sealed record WeeklyOffDto(Guid Id, Guid CompanyId, string DayOfWeekName, bool IsActive);
