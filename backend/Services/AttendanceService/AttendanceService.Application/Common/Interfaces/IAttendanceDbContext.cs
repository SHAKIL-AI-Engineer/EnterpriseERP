using AttendanceService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Application.Common.Interfaces;

public interface IAttendanceDbContext
{
    DbSet<DailyAttendance> DailyAttendances { get; }
    DbSet<DeviceLog> DeviceLogs { get; }
    DbSet<AttendanceProcessBatch> AttendanceProcessBatches { get; }
    DbSet<AttendanceProcessError> AttendanceProcessErrors { get; }
    DbSet<AttendanceBillRecord> AttendanceBillRecords { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
