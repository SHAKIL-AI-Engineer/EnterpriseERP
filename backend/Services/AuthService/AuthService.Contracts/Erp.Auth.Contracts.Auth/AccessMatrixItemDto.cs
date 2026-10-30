namespace AuthService.Contracts.Auth;

public sealed class AccessMatrixItemDto
{
	public string Module { get; init; } = string.Empty;

	public string RoutePattern { get; init; } = string.Empty;

	public string? HttpMethod { get; init; }

	public string PermissionCode { get; init; } = string.Empty;

	public bool IsMenuRoute { get; init; }
}
