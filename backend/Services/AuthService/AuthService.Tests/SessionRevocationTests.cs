using AuthService.Contracts.Common;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.AspNetCore.Identity;
using AuthService.Infrastructure;
using Xunit;

namespace AuthService.Tests;

public sealed class SessionRevocationTests
{
    [Fact]
    public async Task Identity_password_reset_enforces_policy_and_revokes_existing_sessions()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthInfrastructure(new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["ConnectionStrings:AuthDb"] = "Server=unused;Database=PasswordResetTest" }).Build());
        services.RemoveAll<AuthDbContext>();
        services.RemoveAll<DbContextOptions<AuthDbContext>>();
        services.RemoveAll<IDbContextOptionsConfiguration<AuthDbContext>>();
        services.AddDbContext<AuthDbContext>(options => options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        await using var provider = services.BuildServiceProvider();
        var db = provider.GetRequiredService<AuthDbContext>();
        var manager = provider.GetRequiredService<UserManager<AppUser>>();
        var user = new AppUser { Id = Guid.NewGuid(), UserName = "password-fixture", Email = "password-fixture@example.invalid",
            FullName = "Password fixture", IsActive = true, Status = UserStatus.Active };
        Assert.True((await manager.CreateAsync(user, "OriginalFixture123")).Succeeded);
        var session = new RefreshToken { Id = Guid.NewGuid(), UserId = user.Id, TokenHash = "reset-fixture-hash",
            FamilyId = Guid.NewGuid(), ExpiresAt = DateTimeOffset.UtcNow.AddDays(1) };
        db.RefreshTokens.Add(session);
        await db.SaveChangesAsync();
        var originalStamp = user.SecurityStamp;
        var originalHash = user.PasswordHash;
        var resetToken = await manager.GeneratePasswordResetTokenAsync(user);

        Assert.False((await manager.ResetPasswordAsync(user, resetToken, "weak")).Succeeded);
        Assert.Equal(originalHash, user.PasswordHash);
        Assert.Equal(originalStamp, user.SecurityStamp);
        Assert.False(session.IsRevoked);

        Assert.True((await manager.ResetPasswordAsync(user, resetToken, "ReplacementFixture456")).Succeeded);
        Assert.False(await manager.CheckPasswordAsync(user, "OriginalFixture123"));
        Assert.True(await manager.CheckPasswordAsync(user, "ReplacementFixture456"));
        Assert.NotEqual(originalStamp, user.SecurityStamp);
        Assert.True(session.IsRevoked);
    }

    [Fact]
    public async Task Routine_identity_updates_preserve_sessions_but_status_changes_revoke_them()
    {
        await using var db = new AuthDbContext(new DbContextOptionsBuilder<AuthDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var user = new AppUser { Id = Guid.NewGuid(), UserName = "fixture", FullName = "Fixture", SecurityStamp = "original", IsActive = true, Status = UserStatus.Active };
        var token = new RefreshToken { Id = Guid.NewGuid(), UserId = user.Id, TokenHash = "fixture-hash", FamilyId = Guid.NewGuid(), ExpiresAt = DateTimeOffset.UtcNow.AddDays(1) };
        db.Users.Add(user); db.RefreshTokens.Add(token); await db.SaveChangesAsync();

        // Identity's UserStore marks every property modified, even during a routine login.
        user.LastLoginAt = DateTimeOffset.UtcNow;
        db.Update(user);
        await db.SaveChangesAsync();
        Assert.Equal("original", user.SecurityStamp);
        Assert.False(token.IsRevoked);

        user.IsActive = false; user.Status = UserStatus.Inactive;
        await db.SaveChangesAsync();
        Assert.NotEqual("original", user.SecurityStamp);
        Assert.True(token.IsRevoked);
    }

    [Fact]
    public async Task Role_membership_changes_revoke_access_and_refresh_sessions()
    {
        await using var db = new AuthDbContext(new DbContextOptionsBuilder<AuthDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var user = new AppUser { Id = Guid.NewGuid(), UserName = "fixture", FullName = "Fixture", SecurityStamp = "original", IsActive = true };
        db.Users.Add(user); await db.SaveChangesAsync();
        db.UserRoles.Add(new Microsoft.AspNetCore.Identity.IdentityUserRole<Guid> { UserId = user.Id, RoleId = Guid.NewGuid() });
        await db.SaveChangesAsync();
        Assert.NotEqual("original", user.SecurityStamp);
    }
}
