using System;
using System.Collections.Generic;

namespace AuthService.Infrastructure.Entities;

public sealed class Permission
{
	public Guid Id { get; set; }

	public string Code { get; set; } = string.Empty;

	public string Description { get; set; } = string.Empty;

	public DateTimeOffset CreatedAt { get; set; }

	public Guid? CreatedBy { get; set; }

	public DateTimeOffset? UpdatedAt { get; set; }

	public Guid? UpdatedBy { get; set; }

	public bool IsDeleted { get; set; }

	public DateTimeOffset? DeletedAt { get; set; }

	public Guid? DeletedBy { get; set; }

	public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
