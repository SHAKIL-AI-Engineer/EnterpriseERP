using System;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Infrastructure.Identity;

public sealed class AppRole : IdentityRole<Guid>
{
	public DateTimeOffset CreatedAt { get; set; }

	public Guid? CreatedBy { get; set; }

	public DateTimeOffset? UpdatedAt { get; set; }

	public Guid? UpdatedBy { get; set; }

	public bool IsDeleted { get; set; }

	public DateTimeOffset? DeletedAt { get; set; }

	public Guid? DeletedBy { get; set; }
}
