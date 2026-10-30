namespace ShiftService.Domain.Enums;

public enum ShiftCategory
{
    GeneralDuty = 0,
    Day = 1,
    Night = 2
}

public enum ShiftType
{
    Day,
    Night,
    GeneralDuty,
    Rotational
}

public enum BreakType
{
    Lunch = 0,
    Other = 1
}

public enum DayType
{
    WorkingDay,
    WeeklyOff,
    Holiday,
    SpecialWorkingDay
}
