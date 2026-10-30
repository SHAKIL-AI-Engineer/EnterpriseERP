using AuthService.Contracts.Common;

namespace AuthService.Contracts.Users;

public sealed class UpdateUserStatusRequest
{
	public UserStatus Status { get; init; }

	public bool IsActive { get; init; } = true;
}
