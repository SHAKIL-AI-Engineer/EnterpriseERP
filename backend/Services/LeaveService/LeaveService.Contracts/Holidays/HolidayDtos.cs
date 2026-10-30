namespace LeaveService.Contracts.Holidays;

public sealed record HolidayRequest(
    Guid CompanyId,
    DateOnly HolidayDate,
    string HolidayName,
    string HolidayType,
    bool IsPaid,
    bool IsActive);

public sealed record HolidayDto(
    Guid Id,
    Guid CompanyId,
    DateOnly HolidayDate,
    string HolidayName,
    string HolidayType,
    bool IsPaid,
    bool IsActive,
    DateTime CreatedAt);
