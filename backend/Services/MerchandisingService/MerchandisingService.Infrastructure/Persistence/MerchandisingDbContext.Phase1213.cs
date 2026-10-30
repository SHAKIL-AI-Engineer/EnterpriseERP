using MerchandisingService.Application;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Infrastructure.Persistence;

public sealed partial class MerchandisingDbContext
{
    public DbSet<StyleDocument> StyleDocuments => Set<StyleDocument>();
    public DbSet<OrderDocument> OrderDocuments => Set<OrderDocument>();
    public DbSet<CommunicationLog> CommunicationLogs => Set<CommunicationLog>();
    public DbSet<ApprovalRequest> ApprovalRequests => Set<ApprovalRequest>();
    public DbSet<ApprovalStep> ApprovalSteps => Set<ApprovalStep>();
    public DbSet<ShipmentExecution> ShipmentExecutions => Set<ShipmentExecution>();
    public DbSet<PackingList> PackingLists => Set<PackingList>();
    public DbSet<CartonBreakdown> CartonBreakdowns => Set<CartonBreakdown>();

    IQueryable<StyleDocument> IMerchandisingDbContext.StyleDocuments => StyleDocuments;
    IQueryable<OrderDocument> IMerchandisingDbContext.OrderDocuments => OrderDocuments;
    IQueryable<CommunicationLog> IMerchandisingDbContext.CommunicationLogs => CommunicationLogs;
    IQueryable<ApprovalRequest> IMerchandisingDbContext.ApprovalRequests => ApprovalRequests;
    IQueryable<ApprovalStep> IMerchandisingDbContext.ApprovalSteps => ApprovalSteps;
    IQueryable<ShipmentExecution> IMerchandisingDbContext.ShipmentExecutions => ShipmentExecutions;
    IQueryable<PackingList> IMerchandisingDbContext.PackingLists => PackingLists;
    IQueryable<CartonBreakdown> IMerchandisingDbContext.CartonBreakdowns => CartonBreakdowns;

    partial void ConfigurePhase1213Entities(ModelBuilder modelBuilder)
    {
        ConfigureAuditable<StyleDocument>(modelBuilder);
        ConfigureAuditable<OrderDocument>(modelBuilder);
        ConfigureAuditable<CommunicationLog>(modelBuilder);
        ConfigureAuditable<ApprovalRequest>(modelBuilder);
        ConfigureAuditable<ShipmentExecution>(modelBuilder);
        ConfigureAuditable<PackingList>(modelBuilder);
        ConfigureAuditable<CartonBreakdown>(modelBuilder);

        modelBuilder.Entity<StyleDocument>(e =>
        {
            e.ToTable("StyleDocuments");
            e.Property(x => x.DocumentType).HasMaxLength(50).IsRequired();
            e.Property(x => x.FileName).HasMaxLength(255).IsRequired();
            e.Property(x => x.FileUrl).HasMaxLength(500).IsRequired();
            e.Property(x => x.Version).HasMaxLength(20);
            e.HasOne(x => x.Style).WithMany().HasForeignKey(x => x.StyleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderDocument>(e =>
        {
            e.ToTable("OrderDocuments");
            e.Property(x => x.DocumentType).HasMaxLength(50).IsRequired();
            e.Property(x => x.FileName).HasMaxLength(255).IsRequired();
            e.Property(x => x.FileUrl).HasMaxLength(500).IsRequired();
            e.Property(x => x.Version).HasMaxLength(20);
            e.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CommunicationLog>(e =>
        {
            e.ToTable("CommunicationLogs");
            e.Property(x => x.Direction).HasMaxLength(50).IsRequired();
            e.Property(x => x.Subject).HasMaxLength(200).IsRequired();
            e.Property(x => x.Message).HasMaxLength(4000).IsRequired();
            e.Property(x => x.ContactName).HasMaxLength(150);
            e.HasOne(x => x.Style).WithMany().HasForeignKey(x => x.StyleId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ApprovalRequest>(e =>
        {
            e.ToTable("ApprovalRequests");
            e.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
            e.Property(x => x.RequestType).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(ApprovalRequestStatuses.Pending);
            e.Property(x => x.RequestedBy).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.EntityType, x.EntityId });
        });

        modelBuilder.Entity<ApprovalStep>(e =>
        {
            e.ToTable("ApprovalSteps");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(ApprovalStepStatuses.Pending);
            e.Property(x => x.Remarks).HasMaxLength(500);
            e.HasOne(x => x.ApprovalRequest).WithMany(x => x.Steps).HasForeignKey(x => x.ApprovalRequestId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ShipmentExecution>(e =>
        {
            e.ToTable("ShipmentExecutions");
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(ShipmentExecutionStatuses.Planned);
            e.HasIndex(x => x.ShipmentPlanId).IsUnique();
            e.HasOne(x => x.ShipmentPlan).WithMany().HasForeignKey(x => x.ShipmentPlanId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PackingList>(e =>
        {
            e.ToTable("PackingLists");
            e.Property(x => x.GrossWeightKg).HasPrecision(18, 4);
            e.Property(x => x.NetWeightKg).HasPrecision(18, 4);
            e.HasOne(x => x.ShipmentExecution).WithMany(x => x.PackingLists).HasForeignKey(x => x.ShipmentExecutionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartonBreakdown>(e =>
        {
            e.ToTable("CartonBreakdowns");
            e.Property(x => x.ColorName).HasMaxLength(100).IsRequired();
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.PackingList).WithMany(x => x.CartonBreakdowns).HasForeignKey(x => x.PackingListId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
