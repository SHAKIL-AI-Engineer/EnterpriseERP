namespace AttendanceService.Infrastructure.Persistence.PunchData;

/// <summary>Keyless read model for PunchRecords (supports bigint CompanyId/PunchNumber from SQL).</summary>
public sealed class PunchRecordReadRow
{
    public string Id { get; set; } = string.Empty;
    public long CompanyId { get; set; }
    public long PunchNumber { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public DateTimeOffset PunchTime { get; set; }
}
