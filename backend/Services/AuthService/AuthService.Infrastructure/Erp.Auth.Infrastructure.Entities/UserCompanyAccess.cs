using AuthService.Infrastructure.Identity;

namespace AuthService.Infrastructure.Entities;

public sealed class UserCompanyAccess
{
	public Guid Id { get; set; }

	public Guid UserId { get; set; }

	public AppUser User { get; set; } = null!;

	public Guid CompanyGuid { get; set; }

	public bool IsDefaultCompany { get; set; }

	public bool IsActive { get; set; } = true;

	public DateTimeOffset CreatedAt { get; set; }

	public Guid? CreatedBy { get; set; }

	public DateTimeOffset? UpdatedAt { get; set; }

	public Guid? UpdatedBy { get; set; }

	public bool IsDeleted { get; set; }

	public DateTimeOffset? DeletedAt { get; set; }

	public Guid? DeletedBy { get; set; }
}
