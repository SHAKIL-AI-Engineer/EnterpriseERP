namespace AttendanceService.Application.Common;

public sealed record AttendancePunchInput(DateTime PunchTime, Guid? PunchRecordId = null);

