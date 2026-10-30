namespace AttendanceService.Application.Common;

public static class AttendanceDateRange
{
    public static DateTime ToCalendarDate(DateTime value) => value.Date;

    public static (DateTime StartInclusive, DateTime EndExclusive) ToInclusiveRange(DateTime from, DateTime to)
    {
        var start = from.Date;
        var end = to.Date.AddDays(1);
        if (end < start)
        {
            end = start.AddDays(1);
        }

        return (start, end);
    }
}
