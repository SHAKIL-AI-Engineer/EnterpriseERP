using HRService.Application.Employees;
using Microsoft.Extensions.Caching.Memory;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeExcelImportSessionStore(IMemoryCache cache)
{
    private static readonly TimeSpan Ttl = TimeSpan.FromHours(2);

    public string Store(Guid companyId, IReadOnlyList<EmployeeImportRowDto> rows)
    {
        var sessionId = Guid.NewGuid().ToString("N");
        cache.Set(
            CacheKey(sessionId),
            new Session(companyId, rows),
            new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = Ttl });
        return sessionId;
    }

    public IReadOnlyList<EmployeeImportRowDto>? Take(Guid companyId, string sessionId)
    {
        if (!cache.TryGetValue(CacheKey(sessionId), out Session? session) || session is null)
        {
            return null;
        }

        cache.Remove(CacheKey(sessionId));
        return session.CompanyId == companyId ? session.Rows : null;
    }

    private static string CacheKey(string sessionId) => "employee-excel-import:" + sessionId;

    private sealed record Session(Guid CompanyId, IReadOnlyList<EmployeeImportRowDto> Rows);
}
