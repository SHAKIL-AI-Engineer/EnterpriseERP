using Microsoft.EntityFrameworkCore;



namespace AttendanceService.Infrastructure.Persistence.PunchData;



public sealed class PunchDataReadDbContext(DbContextOptions<PunchDataReadDbContext> options) : DbContext(options)

{

    public DbSet<PunchRecordReadRow> PunchRecordRows => Set<PunchRecordReadRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PunchRecordReadRow>(entity =>
        {
            entity.HasNoKey();
            entity.Property(x => x.Id).HasColumnName("Id");
            entity.Property(x => x.CompanyId).HasColumnName("CompanyId");
            entity.Property(x => x.PunchNumber).HasColumnName("PunchNumber");
            entity.Property(x => x.DeviceId).HasColumnName("DeviceId");
            entity.Property(x => x.PunchTime).HasColumnName("PunchTime");
        });
    }

}

