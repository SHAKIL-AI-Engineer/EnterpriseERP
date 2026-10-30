using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.EntityFrameworkCore;
using ShiftService.Domain.Entities;
using ShiftService.Domain.Enums;
using ShiftService.Application.Common.Interfaces;

namespace ShiftService.Infrastructure.Persistence;

public sealed class ShiftDbContext(DbContextOptions<ShiftDbContext> options, ITenantContext? tenant = null) : TenantDbContext(options, tenant), IShiftDbContext
{
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<ShiftRule> ShiftRules => Set<ShiftRule>();
    public DbSet<ShiftBreak> ShiftBreaks => Set<ShiftBreak>();
    public DbSet<EmployeeShiftAssignment> EmployeeShiftAssignments => Set<EmployeeShiftAssignment>();
    public DbSet<TemporaryShiftAssignment> TemporaryShiftAssignments => Set<TemporaryShiftAssignment>();
    public DbSet<ShiftCalendar> ShiftCalendars => Set<ShiftCalendar>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Shift>(b =>
        {
            b.ToTable("Shifts");
            b.HasKey(x => x.Id);
            b.Property(x => x.ShiftName).HasMaxLength(150).IsRequired();
            b.Property(x => x.ShiftType).HasMaxLength(50).IsRequired();
            b.Property(x => x.ShiftCategory).HasConversion<int>();
            b.Property(x => x.PunchWindowBeforeMinutes).HasDefaultValue(60);
            b.Property(x => x.WeeklyOffDayOfWeek);
            b.HasIndex(x => new { x.CompanyId, x.ShiftName }).IsUnique();
        });

        modelBuilder.Entity<ShiftRule>(b =>
        {
            b.ToTable("ShiftRules");
            b.HasKey(x => x.Id);
            b.HasOne(x => x.Shift).WithOne(s => s.Rule).HasForeignKey<ShiftRule>(x => x.ShiftId);
        });

        modelBuilder.Entity<ShiftBreak>(b =>
        {
            b.ToTable("ShiftBreaks");
            b.HasKey(x => x.Id);
            b.Property(x => x.BreakName).HasMaxLength(100).IsRequired();
            b.Property(x => x.BreakType).HasConversion<int>();
            b.HasOne(x => x.Shift).WithMany(s => s.Breaks).HasForeignKey(x => x.ShiftId);
        });

        modelBuilder.Entity<EmployeeShiftAssignment>(b =>
        {
            b.ToTable("EmployeeShiftAssignments");
            b.HasKey(x => x.Id);
            b.HasOne(x => x.Shift).WithMany().HasForeignKey(x => x.ShiftId);
            b.HasIndex(x => new { x.CompanyId, x.EmployeeId, x.IsCurrent });
            b.HasIndex(x => new { x.CompanyId, x.EmployeeId })
                .HasFilter("[IsCurrent] = 1")
                .IsUnique();
        });

        modelBuilder.Entity<TemporaryShiftAssignment>(b =>
        {
            b.ToTable("TemporaryShiftAssignments");
            b.HasKey(x => x.Id);
            b.HasOne(x => x.Shift).WithMany().HasForeignKey(x => x.ShiftId);
            b.HasIndex(x => new { x.CompanyId, x.EmployeeId, x.ShiftDate }).IsUnique();
        });

        modelBuilder.Entity<ShiftCalendar>(b =>
        {
            b.ToTable("ShiftCalendars");
            b.HasKey(x => x.Id);
            b.Property(x => x.DayType).HasMaxLength(50).IsRequired();
        });

        // Seed Data
        var unityId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var ekusheId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var dyeingId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        modelBuilder.Entity<Shift>().HasData(
            new Shift { Id = Guid.Parse("f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5d"), CompanyId = unityId, ShiftName = "Unity General Duty", ShiftType = "GeneralDuty", ShiftCategory = ShiftCategory.GeneralDuty, PunchWindowBeforeMinutes = 60, StartTime = new TimeSpan(8, 0, 0), EndTime = new TimeSpan(17, 0, 0), IsGeneralDuty = true, IsCrossDay = false, IsDefault = true },
            new Shift { Id = Guid.Parse("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), CompanyId = ekusheId, ShiftName = "Ekushe General Duty", ShiftType = "GeneralDuty", ShiftCategory = ShiftCategory.GeneralDuty, PunchWindowBeforeMinutes = 60, StartTime = new TimeSpan(8, 0, 0), EndTime = new TimeSpan(17, 0, 0), IsGeneralDuty = true, IsCrossDay = false, IsDefault = true },
            new Shift { Id = Guid.Parse("b1c2d3e4-f5a6-4a7b-8c9d-0e1f2a3b4c5d"), CompanyId = dyeingId, ShiftName = "Dyeing Day Shift", ShiftType = "Day", ShiftCategory = ShiftCategory.Day, PunchWindowBeforeMinutes = 60, StartTime = new TimeSpan(8, 0, 0), EndTime = new TimeSpan(20, 0, 0), IsCrossDay = false },
            new Shift { Id = Guid.Parse("c1d2e3f4-a5b6-4a7b-8c9d-0e1f2a3b4c5d"), CompanyId = dyeingId, ShiftName = "Dyeing Night Shift", ShiftType = "Night", ShiftCategory = ShiftCategory.Night, PunchWindowBeforeMinutes = 60, StartTime = new TimeSpan(20, 0, 0), EndTime = new TimeSpan(8, 0, 0), IsCrossDay = true }
        );
        ApplyCompanyFilters(modelBuilder);
    }
}
