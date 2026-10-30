using Microsoft.EntityFrameworkCore;
using CompanyEntity = CompanyService.Domain.Entities.Company;
using CompanyService.Domain.Entities;

namespace CompanyService.Infrastructure.Persistence;

public sealed class CompanyDbContext(DbContextOptions<CompanyDbContext> options) : DbContext(options)
{
    public DbSet<CompanyEntity> Companies => Set<CompanyEntity>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<Line> Lines => Set<Line>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<Floor> Floors => Set<Floor>();

    // Address master data
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<Division> Divisions => Set<Division>();
    public DbSet<District> Districts => Set<District>();
    public DbSet<Upazila> Upazilas => Set<Upazila>();
    public DbSet<PostOffice> PostOffices => Set<PostOffice>();
    public DbSet<Area> Areas => Set<Area>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CompanyEntity>(b =>
        {
            b.ToTable("Companies");
            b.HasKey(x => x.Id);
            b.Property(x => x.CompanyNameEn).HasMaxLength(200).IsRequired();
            b.HasIndex(x => x.CompanyNameEn).IsUnique();
            b.Property(x => x.CompanyNameBn).HasMaxLength(200);
            b.Property(x => x.AddressEn).HasMaxLength(500);
            b.Property(x => x.AddressBn).HasMaxLength(500);
            b.Property(x => x.Email).HasMaxLength(150);
            b.Property(x => x.Phone).HasMaxLength(50);
            b.Property(x => x.Website).HasMaxLength(150);
            b.Property(x => x.TradeLicenseNo).HasMaxLength(100);
            b.Property(x => x.BIN).HasMaxLength(100);
            b.Property(x => x.TIN).HasMaxLength(100);
            b.Property(x => x.LogoUrl).HasMaxLength(500);
            b.Property(x => x.AuthorizeSignatureUrl).HasMaxLength(500);
            b.Property(x => x.Industry).HasMaxLength(100);
            b.Property(x => x.FoundedYear);
            b.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("Active");
            b.Property(x => x.CreatedAt).HasDefaultValueSql("SYSDATETIME()");
        });

        // Organogram
        modelBuilder.Entity<Department>(b =>
        {
            b.ToTable("Departments");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.HasIndex(x => new { x.CompanyId, x.NameEn }).IsUnique();
            b.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId);
        });

        modelBuilder.Entity<Section>(b =>
        {
            b.ToTable("Sections");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.HasIndex(x => new { x.DepartmentId, x.NameEn }).IsUnique();
            b.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId);
        });

        modelBuilder.Entity<Designation>(b =>
        {
            b.ToTable("Designations");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.HasIndex(x => new { x.SectionId, x.NameEn }).IsUnique();
            b.HasOne(x => x.Section).WithMany().HasForeignKey(x => x.SectionId);
        });

        modelBuilder.Entity<Line>(b =>
        {
            b.ToTable("Lines");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.HasIndex(x => new { x.SectionId, x.NameEn }).IsUnique();
            b.HasOne(x => x.Section).WithMany().HasForeignKey(x => x.SectionId);
        });

        modelBuilder.Entity<Group>(b =>
        {
            b.ToTable("Groups");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId);
        });

        modelBuilder.Entity<Floor>(b =>
        {
            b.ToTable("Floors");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId);
        });

        // Addresses
        modelBuilder.Entity<Country>(b =>
        {
            b.ToTable("Countries");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.Property(x => x.Code).HasMaxLength(10).IsRequired();
        });

        modelBuilder.Entity<Division>(b =>
        {
            b.ToTable("Divisions");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.HasOne(x => x.Country).WithMany().HasForeignKey(x => x.CountryId);
        });

        modelBuilder.Entity<District>(b =>
        {
            b.ToTable("Districts");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.HasOne(x => x.Division).WithMany().HasForeignKey(x => x.DivisionId);
        });

        modelBuilder.Entity<Upazila>(b =>
        {
            b.ToTable("Upazilas");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.HasOne(x => x.District).WithMany().HasForeignKey(x => x.DistrictId);
        });

        modelBuilder.Entity<PostOffice>(b =>
        {
            b.ToTable("PostOffices");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(100).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(100).IsRequired();
            b.Property(x => x.PostalCode).HasMaxLength(20).IsRequired();
            b.HasOne(x => x.Upazila).WithMany().HasForeignKey(x => x.UpazilaId);
        });

        modelBuilder.Entity<Area>(b =>
        {
            b.ToTable("Areas");
            b.HasKey(x => x.Id);
            b.Property(x => x.NameEn).HasMaxLength(200).IsRequired();
            b.Property(x => x.NameBn).HasMaxLength(200).IsRequired();
            b.HasOne(x => x.PostOffice).WithMany().HasForeignKey(x => x.PostOfficeId);
        });
    }
}
