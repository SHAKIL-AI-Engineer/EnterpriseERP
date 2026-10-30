namespace AttendanceService.Application.Common.Interfaces;



public sealed record PunchRecordRow(

    Guid Id,

    int CompanyId,

    int PunchNumber,

    string DeviceId,

    DateTime PunchTime);



public interface IPunchRecordReader

{

    Task<IReadOnlyList<PunchRecordRow>> GetForCompanyAndDateAsync(int punchCompanyId, DateTime date, CancellationToken cancellationToken = default);



    Task<IReadOnlyList<PunchRecordRow>> GetForCompanyAndRangeAsync(

        int punchCompanyId,

        DateTime fromInclusive,

        DateTime toExclusive,

        CancellationToken cancellationToken = default);

}

