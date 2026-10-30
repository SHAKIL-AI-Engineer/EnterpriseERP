using System;
using AuthService.Infrastructure.Identity;

namespace AuthService.Infrastructure.Entities;

public sealed class RolePermission
{
	public Guid RoleId { get; set; }

	public AppRole Role { get; set; } = null!;

	public Guid PermissionId { get; set; }

	public Permission Permission { get; set; } = null!;

	public DateTimeOffset CreatedAt { get; set; }

	public Guid? CreatedBy { get; set; }
}
