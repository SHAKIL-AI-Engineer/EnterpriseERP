using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SecurityService.Application;

namespace SecurityService.Infrastructure.Services;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContextAccessor.HttpContext?.User.FindFirstValue("sub")
                ?? httpContextAccessor.HttpContext?.User.FindFirstValue("userId");
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }
}
