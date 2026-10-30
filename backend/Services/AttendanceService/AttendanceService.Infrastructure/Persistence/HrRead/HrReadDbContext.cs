using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Infrastructure.Persistence.HrRead;

public sealed class HrReadDbContext(DbContextOptions<HrReadDbContext> options) : DbContext(options)
{
    public DbSet<HrEmployeeEntity> Employees => Set<HrEmployeeEntity>();
    public DbSet<HrEmployeeJobInfoEntity> EmployeeJobInfos => Set<HrEmployeeJobInfoEntity>();
    public DbSet<HrDepartmentEntity> Departments => Set<HrDepartmentEntity>();
    public DbSet<HrDesignationEntity> Designations => Set<HrDesignationEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HrEmployeeEntity>(entity =>
        {
            entity.ToTable("Employees");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PunchNumber).HasColumnName("PunchNumber");
            entity.Property(x => x.EmployeeID).HasColumnName("EmployeeID").HasMaxLength(32);
            entity.Property(x => x.FullName).HasColumnName("FullName").HasMaxLength(256);
            entity.Property(x => x.IsOtEnabled).HasColumnName("IsOtEnabled").HasDefaultValue(true);
        });

        modelBuilder.Entity<HrEmployeeJobInfoEntity>(entity =>
        {
            entity.ToTable("EmployeeJobInfos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.WorkLocation).HasMaxLength(256);
            entity.Property(x => x.GroupId);
        });

        modelBuilder.Entity<HrDepartmentEntity>(entity =>
        {
            entity.ToTable("Departments");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(256);
        });

        modelBuilder.Entity<HrDesignationEntity>(entity =>
        {
            entity.ToTable("Designations");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(256);
        });
    }
}
