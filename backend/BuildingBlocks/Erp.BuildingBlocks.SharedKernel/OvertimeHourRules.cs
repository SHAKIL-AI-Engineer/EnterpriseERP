namespace Erp.BuildingBlocks.SharedKernel;

public static class OvertimeHourRules
{
    /// <summary>
    /// Converts OT minutes to whole hours using the bucket rule:
    /// 0–44 min = 0 hr, 45–104 = 1 hr, then +1 hr per additional 60 min.
    /// Equivalent to: IF(minutes &lt; 45, 0, INT((minutes - 45) / 60) + 1)
    /// </summary>
    public static int ConvertMinutesToHours(int otMinutes) =>
        otMinutes < 45 ? 0 : ((otMinutes - 45) / 60) + 1;

    public static int ResolveOtHours(int otMinutes, bool isOtEnabled) =>
        isOtEnabled ? ConvertMinutesToHours(otMinutes) : 0;
}
