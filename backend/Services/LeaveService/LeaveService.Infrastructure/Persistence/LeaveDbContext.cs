using Erp.BuildingBlocks.CommonSecurity;
using LeaveService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LeaveService.Infrastructure.Persistence;

public sealed class LeaveDbContext : TenantDbContext
{
    public LeaveDbContext(DbContextOptions<LeaveDbContext> options, ITenantContext? tenant = null) : base(options, tenant)
    {
    }

    public DbSet<LeaveType> LeaveTypes => Set<LeaveType>();
    public DbSet<LeavePolicy> LeavePolicies => Set<LeavePolicy>();
    public DbSet<EmployeeLeaveBalance> EmployeeLeaveBalances => Set<EmployeeLeaveBalance>();
    public DbSet<LeaveApplication> LeaveApplications => Set<LeaveApplication>();
    public DbSet<LeaveApprovalStep> LeaveApprovalSteps => Set<LeaveApprovalStep>();
    public DbSet<LeaveTransaction> LeaveTransactions => Set<LeaveTransaction>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<WeeklyOffRule> WeeklyOffRules => Set<WeeklyOffRule>();
    public DbSet<EarnLeavePolicy> EarnLeavePolicies => Set<EarnLeavePolicy>();
    public DbSet<LeaveEncashment> LeaveEncashments => Set<LeaveEncashment>();
    public DbSet<PayrollMonthLock> PayrollMonthLocks => Set<PayrollMonthLock>();
    public DbSet<LeaveAuditLog> LeaveAuditLogs => Set<LeaveAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LeaveType>(b =>
        {
            b.ToTable("LeaveTypes");
            b.HasKey(x => x.Id);
            b.Property(x => x.LeaveCode).HasMaxLength(50).IsRequired();
            b.Property(x => x.LeaveName).HasMaxLength(150).IsRequired();
            b.Property(x => x.MaxCarryForwardDays).HasPrecision(18, 2);
            b.Property(x => x.CreatedAt).HasColumnType("datetime2");
            b.Property(x => x.UpdatedAt).HasColumnType("datetime2");
            b.HasIndex(x => new { x.CompanyId, x.LeaveCode }).IsUnique();
        });

        modelBuilder.Entity<LeavePolicy>(b =>
        {
            b.ToTable("LeavePolicies");
            b.HasKey(x => x.Id);
            b.Property(x => x.YearlyEntitlement).HasPrecision(18, 2);
            b.Property(x => x.MonthlyAccrual).HasPrecision(18, 2);
            b.Property(x => x.MaxConsecutiveDays).HasPrecision(18, 2);
            b.Property(x => x.CreatedAt).HasColumnType("datetime2");
            b.Property(x => x.UpdatedAt).HasColumnType("datetime2");
            b.HasIndex(x => new { x.CompanyId, x.LeaveTypeId });
            b.HasOne(x => x.LeaveType).WithMany().HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmployeeLeaveBalance>(b =>
        {
            b.ToTable("EmployeeLeaveBalances");
            b.HasKey(x => x.Id);
            b.Property(x => x.OpeningBalance).HasPrecision(18, 2);
            b.Property(x => x.EntitledDays).HasPrecision(18, 2);
            b.Property(x => x.AccruedDays).HasPrecision(18, 2);
            b.Property(x => x.UsedDays).HasPrecision(18, 2);
            b.Property(x => x.PendingDays).HasPrecision(18, 2);
            b.Property(x => x.EncashDays).HasPrecision(18, 2);
            b.Property(x => x.CarryForwardDays).HasPrecision(18, 2);
            b.Property(x => x.BalanceDays).HasPrecision(18, 2);
            b.Property(x => x.UpdatedAt).HasColumnType("datetime2");
            b.HasIndex(x => new { x.CompanyId, x.EmployeeId, x.LeaveTypeId, x.YearNo }).IsUnique();
            b.HasOne(x => x.LeaveType).WithMany().HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LeaveApplication>(b =>
        {
            b.ToTable("LeaveApplications");
            b.HasKey(x => x.Id);
            b.Property(x => x.FromDate).HasColumnType("date");
            b.Property(x => x.ToDate).HasColumnType("date");
            b.Property(x => x.TotalDays).HasPrecision(18, 2);
            b.Property(x => x.HalfDayType).HasMaxLength(50);
            b.Property(x => x.Reason).HasMaxLength(500);
            b.Property(x => x.Status).HasMaxLength(50);
            b.Property(x => x.AppliedAt).HasColumnType("datetime2");
            b.Property(x => x.ApprovedAt).HasColumnType("datetime2");
            b.Property(x => x.RejectedAt).HasColumnType("datetime2");
            b.Property(x => x.CancelledAt).HasColumnType("datetime2");
            b.Property(x => x.AttachmentUrl).HasMaxLength(500);
            b.HasOne(x => x.LeaveType).WithMany().HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
            b.HasMany(x => x.ApprovalSteps).WithOne(x => x.LeaveApplication).HasForeignKey(x => x.LeaveApplicationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LeaveApprovalStep>(b =>
        {
            b.ToTable("LeaveApprovalSteps");
            b.HasKey(x => x.Id);
            b.Property(x => x.Status).HasMaxLength(50);
            b.Property(x => x.Remarks).HasMaxLength(300);
            b.Property(x => x.ActionAt).HasColumnType("datetime2");
            b.HasIndex(x => new { x.LeaveApplicationId, x.ApprovalLevel }).IsUnique();
        });

        modelBuilder.Entity<LeaveTransaction>(b =>
        {
            b.ToTable("LeaveTransactions");
            b.HasKey(x => x.Id);
            b.Property(x => x.TransactionDate).HasColumnType("datetime2");
            b.Property(x => x.TransactionType).HasMaxLength(50).IsRequired();
            b.Property(x => x.Days).HasPrecision(18, 2);
            b.Property(x => x.Remarks).HasMaxLength(500);
        });

        modelBuilder.Entity<Holiday>(b =>
        {
            b.ToTable("Holidays");
            b.HasKey(x => x.Id);
            b.Property(x => x.HolidayDate).HasColumnType("date");
            b.Property(x => x.HolidayName).HasMaxLength(150).IsRequired();
            b.Property(x => x.HolidayType).HasMaxLength(50).IsRequired();
            b.Property(x => x.CreatedAt).HasColumnType("datetime2");
            b.HasIndex(x => new { x.CompanyId, x.HolidayDate }).IsUnique();
        });

        modelBuilder.Entity<WeeklyOffRule>(b =>
        {
            b.ToTable("WeeklyOffRules");
            b.HasKey(x => x.Id);
            b.Property(x => x.DayOfWeekName).HasMaxLength(20).IsRequired();
            b.HasIndex(x => new { x.CompanyId, x.DayOfWeekName });
        });

        modelBuilder.Entity<EarnLeavePolicy>(b =>
        {
            b.ToTable("EarnLeavePolicies");
            b.HasKey(x => x.Id);
            b.Property(x => x.CalculationType).HasMaxLength(50).IsRequired();
            b.Property(x => x.DaysWorkedForOneEarnLeave).HasPrecision(18, 2);
            b.Property(x => x.MaxEarnLeavePerYear).HasPrecision(18, 2);
            b.HasOne(x => x.LeaveType).WithMany().HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LeaveEncashment>(b =>
        {
            b.ToTable("LeaveEncashments");
            b.HasKey(x => x.Id);
            b.Property(x => x.EncashDays).HasPrecision(18, 2);
            b.Property(x => x.RatePerDay).HasPrecision(18, 2);
            b.Property(x => x.TotalAmount).HasPrecision(18, 2);
            b.Property(x => x.Status).HasMaxLength(50);
            b.Property(x => x.ApprovedAt).HasColumnType("datetime2");
            b.Property(x => x.CreatedAt).HasColumnType("datetime2");
            b.HasOne(x => x.LeaveType).WithMany().HasForeignKey(x => x.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PayrollMonthLock>(b =>
        {
            b.ToTable("PayrollMonthLocks");
            b.HasKey(x => x.Id);
            b.Property(x => x.UpdatedAt).HasColumnType("datetime2");
            b.HasIndex(x => new { x.CompanyId, x.Year, x.Month }).IsUnique();
        });

        modelBuilder.Entity<LeaveAuditLog>(b =>
        {
            b.ToTable("LeaveAuditLogs");
            b.HasKey(x => x.Id);
            b.Property(x => x.Action).HasMaxLength(100).IsRequired();
            b.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
            b.Property(x => x.Details).HasMaxLength(2000);
            b.Property(x => x.CreatedAt).HasColumnType("datetime2");
            b.HasIndex(x => x.CreatedAt);
        });
        modelBuilder.Entity<LeaveApplication>().Property(x => x.Status).IsConcurrencyToken();
        modelBuilder.Entity<LeaveApprovalStep>().Property(x => x.Status).IsConcurrencyToken();
        modelBuilder.Entity<EmployeeLeaveBalance>().Property(x => x.PendingDays).IsConcurrencyToken();
        modelBuilder.Entity<EmployeeLeaveBalance>().Property(x => x.BalanceDays).IsConcurrencyToken();
        ApplyCompanyFilters(modelBuilder);
    }
}
