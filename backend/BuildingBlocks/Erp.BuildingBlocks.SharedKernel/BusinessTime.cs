namespace Erp.BuildingBlocks.SharedKernel;

/// <summary>
/// Business clock for audit timestamps (CreatedAt, UpdatedAt, DeletedAt).
/// All ERP services store audit fields in Asia/Dhaka (UTC+6).
/// Punch/device log times use wall-clock storage separately — do not convert punch times through this type.
/// </summary>
public static class BusinessTime
{
    public const string TimeZoneId = "Asia/Dhaka";
    private static readonly TimeSpan FixedOffset = TimeSpan.FromHours(6);

    private static TimeZoneInfo? _timeZone;

    private static TimeZoneInfo TimeZone
    {
        get
        {
            if (_timeZone is not null)
            {
                return _timeZone;
            }

            try
            {
                _timeZone = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
                _timeZone = TimeZoneInfo.CreateCustomTimeZone(TimeZoneId, FixedOffset, TimeZoneId, TimeZoneId);
            }
            catch (InvalidTimeZoneException)
            {
                _timeZone = TimeZoneInfo.CreateCustomTimeZone(TimeZoneId, FixedOffset, TimeZoneId, TimeZoneId);
            }

            return _timeZone;
        }
    }

    /// <summary>Current business time with +06:00 offset (for DateTimeOffset audit columns).</summary>
    public static DateTimeOffset NowOffset =>
        TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, TimeZone);

    /// <summary>Current business wall-clock (Unspecified kind, for DateTime audit columns).</summary>
    public static DateTime Now =>
        DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZone), DateTimeKind.Unspecified);

    /// <summary>True UTC — use only for JWT expiry, protocol timestamps, etc.</summary>
    public static DateTime UtcNow => DateTime.UtcNow;

    /// <summary>True UTC with offset — use only when wire format requires Z/UTC.</summary>
    public static DateTimeOffset UtcNowOffset => DateTimeOffset.UtcNow;
}
