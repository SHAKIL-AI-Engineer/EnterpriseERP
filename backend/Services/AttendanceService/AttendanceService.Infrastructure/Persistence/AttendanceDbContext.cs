using Erp.BuildingBlocks.CommonSecurity;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Infrastructure.Persistence;

public class AttendanceDbContext : TenantDbContext, IAttendanceDbContext
{
    public AttendanceDbContext(DbContextOptions<AttendanceDbContext> options, ITenantContext? tenant = null) : base(options, tenant) { }

    public DbSet<DailyAttendance> DailyAttendances => Set<DailyAttendance>();
    public DbSet<DeviceLog> DeviceLogs => Set<DeviceLog>();
    public DbSet<AttendanceProcessBatch> AttendanceProcessBatches => Set<AttendanceProcessBatch>();
    public DbSet<AttendanceProcessError> AttendanceProcessErrors => Set<AttendanceProcessError>();
    public DbSet<AttendanceBillRecord> AttendanceBillRecords => Set<AttendanceBillRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DailyAttendance>(entity =>
        {
            entity.Property(e => e.EmployeeId).HasColumnName("HrEmployeeId");
            entity.Property(e => e.PunchNumber).IsRequired();
            entity.Property(e => e.EmployeeID).HasMaxLength(32).IsRequired();
            entity.HasIndex(e => new { e.CompanyId, e.EmployeeId, e.AttendanceDate }).IsUnique();
            entity.HasIndex(e => new { e.CompanyId, e.PunchNumber, e.AttendanceDate });
            entity.HasIndex(e => e.InPunchId);
            entity.HasIndex(e => e.OutPunchId);
        });

        modelBuilder.Entity<DeviceLog>(entity =>
        {
            entity.Property(e => e.EmployeeId).HasColumnName("HrEmployeeId");
            entity.Property(e => e.EmployeeID).HasMaxLength(32).IsRequired();
            entity.Property(e => e.PunchNumber).IsRequired();
            entity.Property(e => e.DeviceSerial).HasMaxLength(450);
            entity.HasIndex(e => new { e.CompanyId, e.PunchNumber, e.PunchTime, e.DeviceSerial })
                .IsUnique()
                .HasFilter("[DeviceSerial] IS NOT NULL");
        });

        modelBuilder.Entity<AttendanceProcessBatch>(entity =>
        {
            entity.HasIndex(e => new { e.CompanyId, e.StartedAt });
        });

        modelBuilder.Entity<AttendanceProcessError>(entity =>
        {
            entity.HasIndex(e => new { e.BatchId, e.AttendanceDate });
        });

        modelBuilder.Entity<AttendanceBillRecord>(entity =>
        {
            entity.ToTable("AttendanceBillRecords");
            entity.HasIndex(e => new { e.CompanyId, e.BillType, e.BillDate });
            entity.HasIndex(e => new { e.CompanyId, e.EmployeeId, e.BillType, e.BillDate }).IsUnique();
            entity.Property(e => e.EmployeeId).HasColumnName("HrEmployeeId");
            entity.Property(e => e.Amount).HasPrecision(18, 2);
        });
        ApplyCompanyFilters(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return base.SaveChangesAsync(cancellationToken);
    }
}
