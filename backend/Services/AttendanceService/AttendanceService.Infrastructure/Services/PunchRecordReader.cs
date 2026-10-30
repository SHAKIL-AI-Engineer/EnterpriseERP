using AttendanceService.Application.Common.Interfaces;

using AttendanceService.Infrastructure.Persistence.PunchData;

using Microsoft.EntityFrameworkCore;



namespace AttendanceService.Infrastructure.Services;



public sealed class PunchRecordReader(PunchDataReadDbContext db) : IPunchRecordReader

{

    public Task<IReadOnlyList<PunchRecordRow>> GetForCompanyAndDateAsync(

        int punchCompanyId,

        DateTime date,

        CancellationToken cancellationToken = default) =>

        GetForCompanyAndRangeAsync(punchCompanyId, date.Date, date.Date.AddDays(1), cancellationToken);



    public async Task<IReadOnlyList<PunchRecordRow>> GetForCompanyAndRangeAsync(

        int punchCompanyId,

        DateTime fromInclusive,

        DateTime toExclusive,

        CancellationToken cancellationToken = default)

    {

        var dayStart = DateTime.SpecifyKind(fromInclusive.Date, DateTimeKind.Unspecified);

        var dayEnd = DateTime.SpecifyKind(toExclusive.Date, DateTimeKind.Unspecified);



        var rows = await db.PunchRecordRows

            .FromSqlInterpolated($"""

                SELECT Id, CompanyId, PunchNumber, DeviceId, PunchTime

                FROM PunchRecords

                WHERE CompanyId = {punchCompanyId}

                  AND PunchTime >= {dayStart}

                  AND PunchTime < {dayEnd}

                ORDER BY PunchTime

                """)

            .AsNoTracking()

            .ToListAsync(cancellationToken);



        return rows

            .Select(p => new PunchRecordRow(

                Guid.TryParse(p.Id, out var punchId) ? punchId : Guid.Empty,

                ToCompanyIdInt(p.CompanyId),

                ToPunchNumberInt(p.PunchNumber),

                p.DeviceId ?? string.Empty,

                ToWallClockPunchTime(p.PunchTime)))

            .ToList();

    }



    /// <summary>

    /// Keeps device wall-clock (07:56 stays 07:56) regardless of +00:00 offset storage.

    /// </summary>

    internal static DateTime ToWallClockPunchTime(DateTimeOffset punchTime) =>

        DateTime.SpecifyKind(

            new DateTime(

                punchTime.Year,

                punchTime.Month,

                punchTime.Day,

                punchTime.Hour,

                punchTime.Minute,

                punchTime.Second,

                punchTime.Millisecond),

            DateTimeKind.Unspecified);



    private static int ToPunchNumberInt(long punchNumber) =>

        punchNumber is > 0 and <= int.MaxValue ? (int)punchNumber : 0;



    private static int ToCompanyIdInt(long companyId) =>

        companyId is > 0 and <= int.MaxValue ? (int)companyId : 0;

}


