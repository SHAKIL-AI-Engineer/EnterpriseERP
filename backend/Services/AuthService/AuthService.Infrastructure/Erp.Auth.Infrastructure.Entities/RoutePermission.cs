namespace AuthService.Infrastructure.Entities;

public sealed class RoutePermission
{
	public Guid Id { get; set; }

	public string Module { get; set; } = string.Empty;

	public string RoutePattern { get; set; } = string.Empty;

	public string? HttpMethod { get; set; }

	public string PermissionCode { get; set; } = string.Empty;

	public bool IsMenuRoute { get; set; }

	public DateTimeOffset CreatedAt { get; set; }

	public bool IsDeleted { get; set; }
}
