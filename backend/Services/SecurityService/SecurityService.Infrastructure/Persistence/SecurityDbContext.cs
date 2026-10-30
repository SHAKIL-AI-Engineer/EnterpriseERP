using Microsoft.EntityFrameworkCore;
using SecurityService.Application;
using SecurityService.Domain;

using Erp.BuildingBlocks.SharedKernel;

namespace SecurityService.Infrastructure.Persistence;

public sealed class SecurityDbContext(DbContextOptions<SecurityDbContext> options) : DbContext(options), ISecurityDbContext
{
    public DbSet<Gate> Gates => Set<Gate>();
    public DbSet<Visitor> Visitors => Set<Visitor>();
    public DbSet<VisitorEntry> VisitorEntries => Set<VisitorEntry>();
    public DbSet<EmployeeOutPass> EmployeeOutPasses => Set<EmployeeOutPass>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<VehicleEntry> VehicleEntries => Set<VehicleEntry>();
    public DbSet<GatePass> GatePasses => Set<GatePass>();
    public DbSet<GatePassItem> GatePassItems => Set<GatePassItem>();
    public DbSet<ReturnableGatePassReturn> ReturnableGatePassReturns => Set<ReturnableGatePassReturn>();
    public DbSet<ReturnableGatePassReturnItem> ReturnableGatePassReturnItems => Set<ReturnableGatePassReturnItem>();
    public DbSet<Chalan> Chalans => Set<Chalan>();
    public DbSet<ChalanItem> ChalanItems => Set<ChalanItem>();
    public DbSet<BillEntry> BillEntries => Set<BillEntry>();
    public DbSet<SecurityCheckLog> SecurityCheckLogs => Set<SecurityCheckLog>();
    public DbSet<GateActionLog> GateActionLogs => Set<GateActionLog>();
    public DbSet<ExternalReferenceSnapshot> ExternalReferenceSnapshots => Set<ExternalReferenceSnapshot>();

    IQueryable<Gate> ISecurityDbContext.Gates => Gates;
    IQueryable<Visitor> ISecurityDbContext.Visitors => Visitors;
    IQueryable<VisitorEntry> ISecurityDbContext.VisitorEntries => VisitorEntries;
    IQueryable<EmployeeOutPass> ISecurityDbContext.EmployeeOutPasses => EmployeeOutPasses;
    IQueryable<Vehicle> ISecurityDbContext.Vehicles => Vehicles;
    IQueryable<VehicleEntry> ISecurityDbContext.VehicleEntries => VehicleEntries;
    IQueryable<GatePass> ISecurityDbContext.GatePasses => GatePasses;
    IQueryable<GatePassItem> ISecurityDbContext.GatePassItems => GatePassItems;
    IQueryable<ReturnableGatePassReturn> ISecurityDbContext.ReturnableGatePassReturns => ReturnableGatePassReturns;
    IQueryable<ReturnableGatePassReturnItem> ISecurityDbContext.ReturnableGatePassReturnItems => ReturnableGatePassReturnItems;
    IQueryable<Chalan> ISecurityDbContext.Chalans => Chalans;
    IQueryable<ChalanItem> ISecurityDbContext.ChalanItems => ChalanItems;
    IQueryable<BillEntry> ISecurityDbContext.BillEntries => BillEntries;
    IQueryable<SecurityCheckLog> ISecurityDbContext.SecurityCheckLogs => SecurityCheckLogs;
    IQueryable<GateActionLog> ISecurityDbContext.GateActionLogs => GateActionLogs;
    IQueryable<ExternalReferenceSnapshot> ISecurityDbContext.ExternalReferenceSnapshots => ExternalReferenceSnapshots;

    void ISecurityDbContext.Add<TEntity>(TEntity entity) => Set<TEntity>().Add(entity);
    void ISecurityDbContext.Remove<TEntity>(TEntity entity) => Set<TEntity>().Remove(entity);

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditState();
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ConfigureCompanyEntity<Gate>(modelBuilder);
        ConfigureCompanyEntity<Visitor>(modelBuilder);
        ConfigureCompanyEntity<VisitorEntry>(modelBuilder);
        ConfigureCompanyEntity<EmployeeOutPass>(modelBuilder);
        ConfigureCompanyEntity<Vehicle>(modelBuilder);
        ConfigureCompanyEntity<VehicleEntry>(modelBuilder);
        ConfigureCompanyEntity<GatePass>(modelBuilder);
        ConfigureCompanyEntity<GatePassItem>(modelBuilder);
        ConfigureCompanyEntity<ReturnableGatePassReturn>(modelBuilder);
        ConfigureCompanyEntity<ReturnableGatePassReturnItem>(modelBuilder);
        ConfigureCompanyEntity<Chalan>(modelBuilder);
        ConfigureCompanyEntity<ChalanItem>(modelBuilder);
        ConfigureCompanyEntity<BillEntry>(modelBuilder);
        ConfigureCompanyEntity<SecurityCheckLog>(modelBuilder);
        ConfigureCompanyEntity<ExternalReferenceSnapshot>(modelBuilder);

        modelBuilder.Entity<Gate>(e =>
        {
            e.ToTable("Gates");
            e.Property(x => x.GateCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.GateName).HasMaxLength(150).IsRequired();
            e.Property(x => x.LocationName).HasMaxLength(150);
            e.Property(x => x.IsActive).HasDefaultValue(true);
            e.HasIndex(x => new { x.CompanyId, x.GateCode }).IsUnique();
        });

        modelBuilder.Entity<Visitor>(e =>
        {
            e.ToTable("Visitors");
            e.Property(x => x.VisitorName).HasMaxLength(150).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(50);
            e.Property(x => x.NIDNo).HasMaxLength(50);
            e.Property(x => x.CompanyName).HasMaxLength(150);
            e.Property(x => x.Address).HasMaxLength(300);
            e.Property(x => x.PhotoUrl).HasMaxLength(500);
            e.Property(x => x.IsBlacklisted).HasDefaultValue(false);
            e.HasIndex(x => new { x.CompanyId, x.Phone });
        });

        modelBuilder.Entity<VisitorEntry>(e =>
        {
            e.ToTable("VisitorEntries");
            e.Property(x => x.EntryNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Purpose).HasMaxLength(300).IsRequired();
            e.Property(x => x.VisitorCardNo).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(VisitorEntryStatuses.CheckedIn);
            e.HasIndex(x => new { x.CompanyId, x.EntryNo }).IsUnique();
            e.HasOne(x => x.Gate).WithMany().HasForeignKey(x => x.GateId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Visitor).WithMany().HasForeignKey(x => x.VisitorId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EmployeeOutPass>(e =>
        {
            e.ToTable("EmployeeOutPasses");
            e.Property(x => x.PassNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Reason).HasMaxLength(300).IsRequired();
            e.Property(x => x.ApprovalStatus).HasMaxLength(50).HasDefaultValue(ApprovalStatuses.Pending);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(EmployeeOutPassStatuses.Pending);
            e.HasIndex(x => new { x.CompanyId, x.PassNo }).IsUnique();
            e.HasOne(x => x.Gate).WithMany().HasForeignKey(x => x.GateId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Vehicle>(e =>
        {
            e.ToTable("Vehicles");
            e.Property(x => x.VehicleNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.VehicleType).HasMaxLength(50);
            e.Property(x => x.DriverName).HasMaxLength(150);
            e.Property(x => x.DriverPhone).HasMaxLength(50);
            e.Property(x => x.IsActive).HasDefaultValue(true);
            e.HasIndex(x => new { x.CompanyId, x.VehicleNo }).IsUnique();
        });

        modelBuilder.Entity<VehicleEntry>(e =>
        {
            e.ToTable("VehicleEntries");
            e.Property(x => x.EntryNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Purpose).HasMaxLength(300);
            e.Property(x => x.DriverName).HasMaxLength(150);
            e.Property(x => x.DriverPhone).HasMaxLength(50);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(VehicleEntryStatuses.In);
            e.HasIndex(x => new { x.CompanyId, x.EntryNo }).IsUnique();
            e.HasOne(x => x.Gate).WithMany().HasForeignKey(x => x.GateId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Vehicle).WithMany().HasForeignKey(x => x.VehicleId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GatePass>(e =>
        {
            e.ToTable("GatePasses");
            e.Property(x => x.GatePassNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.GatePassType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Direction).HasMaxLength(20).IsRequired();
            e.Property(x => x.ReferenceType).HasMaxLength(50);
            e.Property(x => x.VehicleNo).HasMaxLength(100);
            e.Property(x => x.DriverName).HasMaxLength(150);
            e.Property(x => x.Purpose).HasMaxLength(300);
            e.Property(x => x.IsReturnable).HasDefaultValue(false);
            e.Property(x => x.ApprovalStatus).HasMaxLength(50).HasDefaultValue(ApprovalStatuses.Pending);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(GatePassStatuses.Draft);
            e.HasIndex(x => new { x.CompanyId, x.GatePassNo }).IsUnique();
            e.HasOne(x => x.Gate).WithMany().HasForeignKey(x => x.GateId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GatePassItem>(e =>
        {
            e.ToTable("GatePassItems");
            e.Property(x => x.ItemName).HasMaxLength(200).IsRequired();
            e.Property(x => x.ItemDescription).HasMaxLength(500);
            e.Property(x => x.UnitName).HasMaxLength(50);
            e.Property(x => x.Quantity).HasPrecision(18, 4);
            e.Property(x => x.ReturnedQty).HasPrecision(18, 4).HasDefaultValue(0);
            e.Property(x => x.Remarks).HasMaxLength(300);
            e.HasOne(x => x.GatePass).WithMany(x => x.Items).HasForeignKey(x => x.GatePassId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReturnableGatePassReturn>(e =>
        {
            e.ToTable("ReturnableGatePassReturns");
            e.Property(x => x.ReturnedBy).HasMaxLength(150);
            e.Property(x => x.Remarks).HasMaxLength(300);
            e.HasOne(x => x.GatePass).WithMany().HasForeignKey(x => x.GatePassId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ReturnableGatePassReturnItem>(e =>
        {
            e.ToTable("ReturnableGatePassReturnItems");
            e.Property(x => x.ReturnQty).HasPrecision(18, 4);
            e.HasOne(x => x.Return).WithMany(x => x.Items).HasForeignKey(x => x.ReturnId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.GatePassItem).WithMany().HasForeignKey(x => x.GatePassItemId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Chalan>(e =>
        {
            e.ToTable("Chalans");
            e.Property(x => x.ChalanNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.ChalanType).HasMaxLength(50).IsRequired();
            e.Property(x => x.VehicleNo).HasMaxLength(100);
            e.Property(x => x.DriverName).HasMaxLength(150);
            e.Property(x => x.Remarks).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Draft);
            e.HasIndex(x => new { x.CompanyId, x.ChalanNo }).IsUnique();
            e.HasOne(x => x.GatePass).WithMany().HasForeignKey(x => x.GatePassId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChalanItem>(e =>
        {
            e.ToTable("ChalanItems");
            e.Property(x => x.ItemName).HasMaxLength(200).IsRequired();
            e.Property(x => x.UnitName).HasMaxLength(50);
            e.Property(x => x.Quantity).HasPrecision(18, 4);
            e.Property(x => x.Remarks).HasMaxLength(300);
            e.HasOne(x => x.Chalan).WithMany(x => x.Items).HasForeignKey(x => x.ChalanId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BillEntry>(e =>
        {
            e.ToTable("BillEntries");
            e.Property(x => x.BillNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.BillType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.VATAmount).HasPrecision(18, 2).HasDefaultValue(0);
            e.Property(x => x.TotalAmount).HasPrecision(18, 2);
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(WorkflowStatuses.Pending);
            e.HasIndex(x => new { x.CompanyId, x.BillNo }).IsUnique();
            e.HasOne(x => x.Chalan).WithMany().HasForeignKey(x => x.ChalanId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.GatePass).WithMany().HasForeignKey(x => x.GatePassId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SecurityCheckLog>(e =>
        {
            e.ToTable("SecurityCheckLogs");
            e.Property(x => x.ReferenceType).HasMaxLength(50).IsRequired();
            e.Property(x => x.CheckResult).HasMaxLength(50).IsRequired();
            e.Property(x => x.Remarks).HasMaxLength(500);
            e.HasIndex(x => new { x.CompanyId, x.ReferenceType, x.ReferenceId });
            e.HasOne(x => x.Gate).WithMany().HasForeignKey(x => x.GateId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GateActionLog>(e =>
        {
            e.ToTable("GateActionLogs");
            e.HasKey(x => x.Id);
            e.Property(x => x.ReferenceType).HasMaxLength(50).IsRequired();
            e.Property(x => x.ActionName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Remarks).HasMaxLength(500);
            e.HasIndex(x => new { x.CompanyId, x.ReferenceType, x.ReferenceId, x.ActionAt });
        });

        modelBuilder.Entity<ExternalReferenceSnapshot>(e =>
        {
            e.ToTable("ExternalReferenceSnapshots");
            e.Property(x => x.ReferenceType).HasMaxLength(50).IsRequired();
            e.Property(x => x.EventName).HasMaxLength(100).IsRequired();
            e.Property(x => x.PayloadJson).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.ReferenceType, x.ReferenceId }).IsUnique();
        });

        Seed(modelBuilder);
    }

    private void ApplyAuditState()
    {
        foreach (var entry in ChangeTracker.Entries<CompanyEntity>().Where(x => x.State is EntityState.Added or EntityState.Modified or EntityState.Deleted))
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = BusinessTime.Now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = BusinessTime.Now;
            }
            else if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.UpdatedAt = BusinessTime.Now;
            }
        }

        if (ChangeTracker.Entries<GateActionLog>().Any(x => x.State == EntityState.Deleted))
        {
            throw new InvalidOperationException("Gate history must never be deleted.");
        }
    }

    private static void ConfigureCompanyEntity<TEntity>(ModelBuilder modelBuilder) where TEntity : CompanyEntity
    {
        modelBuilder.Entity<TEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.CompanyId).IsRequired();
            e.Property(x => x.RowVersion).IsRowVersion();
            e.HasIndex(x => x.CompanyId);
            e.HasQueryFilter(x => !x.IsDeleted);
        });
    }

    private static void Seed(ModelBuilder modelBuilder)
    {
        var companyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var gateId = Guid.Parse("31000000-0000-0000-0000-000000000001");
        var visitorId = Guid.Parse("31000000-0000-0000-0000-000000000002");
        var vehicleId = Guid.Parse("31000000-0000-0000-0000-000000000003");
        var createdAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Gate>().HasData(new Gate
        {
            Id = gateId,
            CompanyId = companyId,
            GateCode = "MAIN",
            GateName = "Main Factory Gate",
            LocationName = "Front Security",
            IsActive = true,
            CreatedAt = createdAt,
        });
        modelBuilder.Entity<Visitor>().HasData(new Visitor
        {
            Id = visitorId,
            CompanyId = companyId,
            VisitorName = "Sample Visitor",
            Phone = "01700000000",
            CompanyName = "Demo Supplier",
            IsBlacklisted = false,
            CreatedAt = createdAt,
        });
        modelBuilder.Entity<Vehicle>().HasData(new Vehicle
        {
            Id = vehicleId,
            CompanyId = companyId,
            VehicleNo = "DHAKA-METRO-11-0001",
            VehicleType = "Covered Van",
            DriverName = "Sample Driver",
            DriverPhone = "01800000000",
            IsActive = true,
            CreatedAt = createdAt,
        });
    }
}
