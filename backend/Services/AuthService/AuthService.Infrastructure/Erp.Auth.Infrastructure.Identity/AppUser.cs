using System;
using AuthService.Contracts.Common;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Infrastructure.Identity;

public sealed class AppUser : IdentityUser<Guid>
{
	public string FullName { get; set; } = string.Empty;

	public string? ProfilePictureUrl { get; set; }

	public string? Country { get; set; }

	public string? City { get; set; }

	public string? Bio { get; set; }

	public bool IsActive { get; set; } = true;

	public UserStatus Status { get; set; } = UserStatus.Active;

	public DateTimeOffset? LastLoginAt { get; set; }

	public DateTimeOffset CreatedAt { get; set; }

	public Guid? CreatedBy { get; set; }

	public DateTimeOffset? UpdatedAt { get; set; }

	public Guid? UpdatedBy { get; set; }

	public bool IsDeleted { get; set; }

	public DateTimeOffset? DeletedAt { get; set; }

	public Guid? DeletedBy { get; set; }
}
