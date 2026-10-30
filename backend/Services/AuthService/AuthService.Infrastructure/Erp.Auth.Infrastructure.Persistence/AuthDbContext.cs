using System;
using AuthService.Contracts.Common;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AuthService.Infrastructure.Persistence;

public sealed class AuthDbContext : IdentityDbContext<AppUser, AppRole, Guid>
{
	public DbSet<UserAccountApproval> UserAccountApprovals => Set<UserAccountApproval>();

	public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

	public DbSet<Permission> Permissions => Set<Permission>();

	public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

	public DbSet<UserCompanyAccess> UserCompanyAccesses => Set<UserCompanyAccess>();

	public DbSet<RoutePermission> RoutePermissions => Set<RoutePermission>();

	public DbSet<UserLoginHistory> UserLoginHistories => Set<UserLoginHistory>();

	public DbSet<UserDevice> UserDevices => Set<UserDevice>();

	public DbSet<User2FA> User2FAs => Set<User2FA>();

	public AuthDbContext(DbContextOptions<AuthDbContext> options)
		: base((DbContextOptions)options)
	{
	}

    public override async System.Threading.Tasks.Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, System.Threading.CancellationToken cancellationToken = default)
    {
        ChangeTracker.DetectChanges();
        var affected = ChangeTracker.Entries<AppUser>().Where(e => e.State == EntityState.Modified
            && new[] { "Status", "IsActive", "IsDeleted", "PasswordHash" }.Any(p => e.Property(p).IsModified && !Equals(e.Property(p).OriginalValue, e.Property(p).CurrentValue)))
            .Select(e => e.Entity.Id).ToHashSet();
        foreach (var entry in ChangeTracker.Entries<Microsoft.AspNetCore.Identity.IdentityUserRole<Guid>>()
            .Where(e => e.State is EntityState.Added or EntityState.Deleted)) affected.Add(entry.Entity.UserId);
        foreach (var entry in ChangeTracker.Entries<UserCompanyAccess>().Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted))
            affected.Add(entry.Entity.UserId);
        var changedRoles = ChangeTracker.Entries<RolePermission>().Where(e => e.State is EntityState.Added or EntityState.Deleted)
            .Select(e => e.Entity.RoleId).Distinct().ToList();
        if (changedRoles.Count > 0)
            foreach (var id in await UserRoles.Where(r => changedRoles.Contains(r.RoleId)).Select(r => r.UserId).Distinct().ToListAsync(cancellationToken)) affected.Add(id);
        if (affected.Count > 0)
        {
            foreach (var user in await Users.Where(u => affected.Contains(u.Id)).ToListAsync(cancellationToken)) user.SecurityStamp = Guid.NewGuid().ToString();
            foreach (var token in await RefreshTokens.Where(t => affected.Contains(t.UserId) && !t.IsRevoked).ToListAsync(cancellationToken))
            { token.IsRevoked = true; token.RevokedAt = DateTimeOffset.UtcNow; token.RevokedReason = "Account access changed"; }
        }
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

	protected override void OnModelCreating(ModelBuilder builder)
	{
		base.OnModelCreating(builder);
        builder.Entity<UserAccountApproval>(b => {
            b.ToTable("AccountApprovals", "administrator");
            b.Property(x => x.Status).HasMaxLength(20);
            b.Property(x => x.Reason).HasMaxLength(2000);
            b.Property(x => x.Version).IsRowVersion();
            b.HasIndex(x => x.UserId).IsUnique();
        });
		builder.Entity(delegate(EntityTypeBuilder<AppUser> b)
		{
			b.Property((AppUser x) => x.FullName).HasMaxLength(256);
			b.Property((AppUser x) => x.ProfilePictureUrl).HasMaxLength(512);
			b.Property((AppUser x) => x.Country).HasMaxLength(100);
			b.Property((AppUser x) => x.City).HasMaxLength(100);
			b.Property((AppUser x) => x.Bio).HasMaxLength(500);
			b.Property((AppUser x) => x.Status).HasConversion<int>();
			b.HasIndex((AppUser x) => x.IsDeleted);
			b.HasIndex((AppUser x) => x.Status);
		});
		builder.Entity(delegate(EntityTypeBuilder<AppRole> b)
		{
			b.HasIndex((AppRole x) => x.IsDeleted);
		});
		builder.Entity(delegate(EntityTypeBuilder<Permission> b)
		{
			b.Property((Permission x) => x.Code).HasMaxLength(128);
			b.Property((Permission x) => x.Description).HasMaxLength(512);
			b.HasIndex((Permission x) => x.Code).IsUnique();
			b.HasIndex((Permission x) => x.IsDeleted);
		});
		builder.Entity(delegate(EntityTypeBuilder<RolePermission> b)
		{
			b.HasKey((RolePermission x) => new { x.RoleId, x.PermissionId });
			b.HasOne((RolePermission x) => x.Role).WithMany().HasForeignKey((RolePermission x) => x.RoleId)
				.OnDelete(DeleteBehavior.Cascade);
			b.HasOne((RolePermission x) => x.Permission).WithMany((Permission x) => x.RolePermissions).HasForeignKey((RolePermission x) => x.PermissionId)
				.OnDelete(DeleteBehavior.Cascade);
		});
		builder.Entity(delegate(EntityTypeBuilder<RefreshToken> b)
		{
			b.Property((RefreshToken x) => x.TokenHash).HasMaxLength(128);
			b.Property((RefreshToken x) => x.RevokedReason).HasMaxLength(256);
			b.Property((RefreshToken x) => x.IpAddress).HasMaxLength(64);
			b.Property((RefreshToken x) => x.MacAddress).HasMaxLength(64);
			b.Property((RefreshToken x) => x.DeviceFingerprint).HasMaxLength(512);
			b.HasIndex((RefreshToken x) => x.TokenHash).IsUnique();
			b.HasIndex((RefreshToken x) => new { x.UserId, x.ExpiresAt });
			b.HasOne((RefreshToken x) => x.User).WithMany().HasForeignKey((RefreshToken x) => x.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		});
		builder.Entity(delegate(EntityTypeBuilder<UserCompanyAccess> b)
		{
			b.HasIndex((UserCompanyAccess x) => new { x.UserId, x.CompanyGuid }).IsUnique();
			b.HasIndex((UserCompanyAccess x) => new { x.UserId, x.IsDefaultCompany });
			b.HasOne((UserCompanyAccess x) => x.User).WithMany().HasForeignKey((UserCompanyAccess x) => x.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		});
		builder.Entity(delegate(EntityTypeBuilder<RoutePermission> b)
		{
			b.Property((RoutePermission x) => x.Module).HasMaxLength(64);
			b.Property((RoutePermission x) => x.RoutePattern).HasMaxLength(512);
			b.Property((RoutePermission x) => x.HttpMethod).HasMaxLength(16);
			b.Property((RoutePermission x) => x.PermissionCode).HasMaxLength(128);
			b.HasIndex((RoutePermission x) => x.RoutePattern);
			b.HasIndex((RoutePermission x) => x.PermissionCode);
		});
		builder.Entity(delegate(EntityTypeBuilder<UserLoginHistory> b)
		{
			b.Property((UserLoginHistory x) => x.IpAddress).HasMaxLength(64);
			b.Property((UserLoginHistory x) => x.MacAddress).HasMaxLength(64);
			b.Property((UserLoginHistory x) => x.DeviceName).HasMaxLength(256);
			b.Property((UserLoginHistory x) => x.Browser).HasMaxLength(128);
			b.Property((UserLoginHistory x) => x.OperatingSystem).HasMaxLength(128);
			b.Property((UserLoginHistory x) => x.FailureReason).HasMaxLength(512);
			b.HasIndex((UserLoginHistory x) => new { x.UserId, x.LoginAt });
			b.HasOne((UserLoginHistory x) => x.User).WithMany().HasForeignKey((UserLoginHistory x) => x.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		});
		builder.Entity(delegate(EntityTypeBuilder<UserDevice> b)
		{
			b.Property((UserDevice x) => x.DeviceName).HasMaxLength(256);
			b.Property((UserDevice x) => x.IpAddress).HasMaxLength(64);
			b.Property((UserDevice x) => x.MacAddress).HasMaxLength(64);
			b.Property((UserDevice x) => x.DeviceFingerprint).HasMaxLength(512);
			b.HasIndex((UserDevice x) => x.UserId);
			b.HasIndex((UserDevice x) => new { x.UserId, x.DeviceFingerprint }).IsUnique()
				.HasFilter("[DeviceFingerprint] IS NOT NULL");
			b.HasOne((UserDevice x) => x.User).WithMany().HasForeignKey((UserDevice x) => x.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		});
		builder.Entity(delegate(EntityTypeBuilder<User2FA> b)
		{
			b.Property((User2FA x) => x.Method).HasMaxLength(64);
			b.Property((User2FA x) => x.SecretKey).HasMaxLength(2048);
			b.Property((User2FA x) => x.RecoveryCodesHash).HasMaxLength(8000);
			b.HasIndex((User2FA x) => x.UserId).IsUnique();
			b.HasOne((User2FA x) => x.User).WithMany().HasForeignKey((User2FA x) => x.UserId)
				.OnDelete(DeleteBehavior.Cascade);
		});
	}
}
