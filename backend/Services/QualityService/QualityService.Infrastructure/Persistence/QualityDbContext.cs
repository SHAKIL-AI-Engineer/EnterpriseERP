using Microsoft.EntityFrameworkCore;
using QualityService.Application;
using QualityService.Domain;

namespace QualityService.Infrastructure.Persistence;

public sealed class QualityDbContext : DbContext, IQualityDbContext
{
    public QualityDbContext(DbContextOptions<QualityDbContext> options) : base(options) { }

    public DbSet<QualityCheckpoint> QualityCheckpoints => Set<QualityCheckpoint>();
    public DbSet<DefectCategory> DefectCategories => Set<DefectCategory>();
    public DbSet<DefectType> DefectTypes => Set<DefectType>();
    public DbSet<QualityInspection> QualityInspections => Set<QualityInspection>();
    public DbSet<QualityInspectionDefect> QualityInspectionDefects => Set<QualityInspectionDefect>();
    public DbSet<QualityRework> QualityReworks => Set<QualityRework>();
    public DbSet<QualityReject> QualityRejects => Set<QualityReject>();
    public DbSet<AQLStandard> AQLStandards => Set<AQLStandard>();
    public DbSet<FinalInspection> FinalInspections => Set<FinalInspection>();
    public DbSet<QualityAuditLog> QualityAuditLogs => Set<QualityAuditLog>();

    void IQualityDbContext.Add<T>(T entity) => Add(entity);
    void IQualityDbContext.Update<T>(T entity) => Update(entity);
    void IQualityDbContext.Remove<T>(T entity) => Remove(entity);

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Optimistic Concurrency Checks RowVersion
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(AuditableEntity).IsAssignableFrom(entityType.ClrType))
            {
                builder.Entity(entityType.ClrType)
                    .Property<byte[]>("RowVersion")
                    .IsRowVersion()
                    .IsConcurrencyToken();
            }
        }

        // Unique indexes per CompanyId
        builder.Entity<QualityCheckpoint>(entity =>
        {
            entity.HasIndex(x => new { x.CompanyId, x.CheckpointCode }).IsUnique();
        });

        builder.Entity<DefectCategory>(entity =>
        {
            entity.HasIndex(x => new { x.CompanyId, x.CategoryCode }).IsUnique();
        });

        builder.Entity<DefectType>(entity =>
        {
            entity.HasIndex(x => new { x.CompanyId, x.DefectCode }).IsUnique();
            entity.HasOne(x => x.DefectCategory)
                  .WithMany(x => x.DefectTypes)
                  .HasForeignKey(x => x.DefectCategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<QualityInspection>(entity =>
        {
            entity.HasIndex(x => new { x.CompanyId, x.InspectionNo }).IsUnique();
            entity.HasOne(x => x.Checkpoint)
                  .WithMany()
                  .HasForeignKey(x => x.CheckpointId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<QualityInspectionDefect>(entity =>
        {
            entity.HasOne(x => x.QualityInspection)
                  .WithMany(x => x.Defects)
                  .HasForeignKey(x => x.QualityInspectionId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.DefectType)
                  .WithMany()
                  .HasForeignKey(x => x.DefectTypeId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<FinalInspection>(entity =>
        {
            entity.HasIndex(x => new { x.CompanyId, x.InspectionNo }).IsUnique();
            entity.HasOne(x => x.AQLStandard)
                  .WithMany()
                  .HasForeignKey(x => x.AQLStandardId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Seed Sample AQL standard ranges (General Inspection Level II)
        var companyId = Guid.Empty; // Zero-guid is used for global template seeds
        builder.Entity<AQLStandard>().HasData(
            new AQLStandard { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), CompanyId = companyId, AQLCode = "AQL-01", AQLLevel = "Level II", LotSizeFrom = 1, LotSizeTo = 8, SampleSize = 2, AcceptQty = 0, RejectQty = 1 },
            new AQLStandard { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), CompanyId = companyId, AQLCode = "AQL-02", AQLLevel = "Level II", LotSizeFrom = 9, LotSizeTo = 15, SampleSize = 3, AcceptQty = 0, RejectQty = 1 },
            new AQLStandard { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), CompanyId = companyId, AQLCode = "AQL-03", AQLLevel = "Level II", LotSizeFrom = 16, LotSizeTo = 25, SampleSize = 5, AcceptQty = 0, RejectQty = 1 },
            new AQLStandard { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), CompanyId = companyId, AQLCode = "AQL-04", AQLLevel = "Level II", LotSizeFrom = 26, LotSizeTo = 50, SampleSize = 8, AcceptQty = 1, RejectQty = 2 },
            new AQLStandard { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), CompanyId = companyId, AQLCode = "AQL-05", AQLLevel = "Level II", LotSizeFrom = 51, LotSizeTo = 90, SampleSize = 13, AcceptQty = 2, RejectQty = 3 },
            new AQLStandard { Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), CompanyId = companyId, AQLCode = "AQL-06", AQLLevel = "Level II", LotSizeFrom = 91, LotSizeTo = 150, SampleSize = 20, AcceptQty = 3, RejectQty = 4 },
            new AQLStandard { Id = Guid.Parse("77777777-7777-7777-7777-777777777777"), CompanyId = companyId, AQLCode = "AQL-07", AQLLevel = "Level II", LotSizeFrom = 151, LotSizeTo = 280, SampleSize = 32, AcceptQty = 5, RejectQty = 6 },
            new AQLStandard { Id = Guid.Parse("88888888-8888-8888-8888-888888888888"), CompanyId = companyId, AQLCode = "AQL-08", AQLLevel = "Level II", LotSizeFrom = 281, LotSizeTo = 500, SampleSize = 50, AcceptQty = 7, RejectQty = 8 }
        );
    }
}
