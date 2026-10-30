using AttendanceService.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AttendanceService.Infrastructure.Services;

public sealed class PunchCompanyIdResolver(IConfiguration configuration) : IPunchCompanyIdResolver
{
    public int? Resolve(Guid companyId)
    {
        var section = configuration.GetSection("PunchData:CompanyIdByGuid");
        var key = companyId.ToString();
        if (section[key] is { } direct && int.TryParse(direct, out var mapped))
        {
            return mapped;
        }

        foreach (var child in section.GetChildren())
        {
            if (!Guid.TryParse(child.Key, out var guid) || !guid.Equals(companyId))
            {
                continue;
            }

            if (int.TryParse(child.Value, out mapped))
            {
                return mapped;
            }
        }

        if (int.TryParse(configuration["PunchData:DefaultCompanyId"], out var fallback) && fallback > 0)
        {
            return fallback;
        }

        return null;
    }
}
