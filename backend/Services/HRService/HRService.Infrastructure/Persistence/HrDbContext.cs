using Erp.BuildingBlocks.CommonSecurity;
using HRService.Application.Employees;
using HRService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Persistence;

public sealed class HrDbContext(DbContextOptions<HrDbContext> options, ITenantContext? tenant = null) : TenantDbContext(options, tenant)
{
    public DbSet<Grade> Grades => Set<Grade>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeJobInfo> EmployeeJobInfos => Set<EmployeeJobInfo>();
    public DbSet<EmployeeSalaryInfo> EmployeeSalaryInfos => Set<EmployeeSalaryInfo>();
    public DbSet<EmployeeAddress> EmployeeAddresses => Set<EmployeeAddress>();
    public DbSet<EmployeeBankAccount> EmployeeBankAccounts => Set<EmployeeBankAccount>();
    public DbSet<EmployeeDocument> EmployeeDocuments => Set<EmployeeDocument>();
    public DbSet<EmployeeEmergencyContact> EmployeeEmergencyContacts => Set<EmployeeEmergencyContact>();
    public DbSet<EmployeeTransfer> EmployeeTransfers => Set<EmployeeTransfer>();
    public DbSet<EmployeeStatusHistory> EmployeeStatusHistories => Set<EmployeeStatusHistory>();
    public DbSet<ManpowerRequirement> ManpowerRequirements => Set<ManpowerRequirement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        foreach (var et in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var p in et.GetProperties().Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                p.SetPrecision(18);
                p.SetScale(2);
            }
        }

        modelBuilder.Entity<Employee>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasIndex(x => new { x.CompanyId, x.PunchNumber }).IsUnique().HasFilter("[IsDeleted] = 0");
            b.HasIndex(x => new { x.CompanyId, x.EmployeeID }).IsUnique().HasFilter("[IsDeleted] = 0");
            b.Property(x => x.Id).HasColumnOrder(0);
            b.Property(x => x.PunchNumber).HasColumnOrder(1).IsRequired();
            b.Property(x => x.EmployeeID).HasColumnName("EmployeeID").HasColumnOrder(2).HasMaxLength(EmployeeIdentityRules.EmployeeIdMaxLength).IsRequired();
            b.Property(x => x.CompanyId).HasColumnOrder(3);
            b.Property(x => x.FullName).HasMaxLength(150).IsRequired();
            b.Property(x => x.BanglaName).HasMaxLength(150);
            b.Property(x => x.Gender).HasMaxLength(20);
            b.Property(x => x.Religion).HasMaxLength(50);
            b.Property(x => x.BloodGroup).HasMaxLength(10);
            b.Property(x => x.NationalId).HasMaxLength(50);
            b.Property(x => x.BirthCertificateNo).HasMaxLength(50);
            b.Property(x => x.Phone).HasMaxLength(50);
            b.Property(x => x.Email).HasMaxLength(150);
            b.Property(x => x.EmploymentType).HasMaxLength(50);
            b.Property(x => x.Status).HasMaxLength(50);
            b.Property(x => x.FatherNameEn).HasMaxLength(150);
            b.Property(x => x.FatherNameBn).HasMaxLength(150);
            b.Property(x => x.MotherNameEn).HasMaxLength(150);
            b.Property(x => x.MotherNameBn).HasMaxLength(150);
            b.Property(x => x.MaritalStatus).HasMaxLength(30);
            b.Property(x => x.SpouseNameEn).HasMaxLength(150);
            b.Property(x => x.SpouseNameBn).HasMaxLength(150);
            b.Property(x => x.SpouseOccupation).HasMaxLength(100);
            b.Property(x => x.SpouseContact).HasMaxLength(50);
            b.Property(x => x.EducationLevel).HasMaxLength(50);
            b.Property(x => x.Institution).HasMaxLength(150);
            b.Property(x => x.FieldOfStudy).HasMaxLength(150);
            b.Property(x => x.Skills).HasMaxLength(1000);
            b.Property(x => x.Reference1Name).HasMaxLength(150);
            b.Property(x => x.Reference1Relation).HasMaxLength(50);
            b.Property(x => x.Reference1Phone).HasMaxLength(50);
            b.Property(x => x.Reference1Address).HasMaxLength(250);
            b.Property(x => x.Reference2Name).HasMaxLength(150);
            b.Property(x => x.Reference2Relation).HasMaxLength(50);
            b.Property(x => x.Reference2Phone).HasMaxLength(50);
            b.Property(x => x.Reference2Address).HasMaxLength(250);
            b.Property(x => x.IsOtEnabled).HasDefaultValue(true);
        });

        modelBuilder.Entity<EmployeeJobInfo>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.WorkLocation).HasMaxLength(150);
            b.HasOne(x => x.Employee).WithMany(x => x.JobInfos).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.EmployeeId, x.IsCurrent })
                .HasDatabaseName("IX_EmployeeJobInfos_EmployeeId_IsCurrent");
        });

        modelBuilder.Entity<EmployeeSalaryInfo>(b =>
        {
            b.HasKey(x => x.Id);
            b.HasOne(x => x.Employee).WithMany(x => x.SalaryInfos).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmployeeAddress>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.AddressType).HasMaxLength(50);
            b.Property(x => x.Country).HasMaxLength(100);
            b.Property(x => x.Division).HasMaxLength(100);
            b.Property(x => x.District).HasMaxLength(100);
            b.Property(x => x.Upazila).HasMaxLength(100);
            b.Property(x => x.PostOffice).HasMaxLength(100);
            b.Property(x => x.PostalCode).HasMaxLength(20);
            b.Property(x => x.AddressLine).HasMaxLength(300);
            b.HasOne(x => x.Employee).WithMany(x => x.Addresses).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmployeeBankAccount>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.BankName).HasMaxLength(150);
            b.Property(x => x.BranchName).HasMaxLength(150);
            b.Property(x => x.AccountNo).HasMaxLength(100);
            b.Property(x => x.RoutingNo).HasMaxLength(100);
            b.Property(x => x.MobileBankingType).HasMaxLength(50);
            b.Property(x => x.MobileBankingNo).HasMaxLength(50);
            b.HasOne(x => x.Employee).WithMany(x => x.BankAccounts).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmployeeDocument>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.DocumentType).HasMaxLength(100);
            b.Property(x => x.FileUrl).HasMaxLength(500);
            b.HasOne(x => x.Employee).WithMany(x => x.Documents).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmployeeEmergencyContact>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.ContactName).HasMaxLength(150);
            b.Property(x => x.Relation).HasMaxLength(50);
            b.Property(x => x.Phone).HasMaxLength(50);
            b.Property(x => x.Address).HasMaxLength(300);
            b.HasOne(x => x.Employee).WithMany(x => x.EmergencyContacts).HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Department>(b =>
        {
            b.HasIndex(x => new { x.CompanyId, x.Name });
            b.Property(x => x.Name).HasMaxLength(256);
            b.Property(x => x.Code).HasMaxLength(64);
        });

        modelBuilder.Entity<Designation>(b =>
        {
            b.Property(x => x.Name).HasMaxLength(256);
            b.HasOne(x => x.Grade).WithMany().HasForeignKey(x => x.GradeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Grade>(b =>
        {
            b.Property(x => x.Name).HasMaxLength(128);
        });

        modelBuilder.Entity<EmployeeTransfer>(b =>
        {
            b.Property(x => x.Reason).HasMaxLength(512);
            b.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmployeeStatusHistory>(b =>
        {
            b.Property(x => x.Status).HasMaxLength(64);
            b.Property(x => x.Remarks).HasMaxLength(512);
            b.HasOne(x => x.Employee).WithMany().HasForeignKey(x => x.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ManpowerRequirement>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Status).HasMaxLength(50);
            b.Property(x => x.Remarks).HasMaxLength(512);
            b.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Designation).WithMany().HasForeignKey(x => x.DesignationId).OnDelete(DeleteBehavior.Restrict);
        });
        ApplyCompanyFilters(modelBuilder);
    }
}
