using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

internal static class GroupNameResolver
{
    public static async Task<IReadOnlyDictionary<Guid, string>> ResolveAsync(
        HrDbContext db,
        IEnumerable<Guid?> groupIds,
        CancellationToken cancellationToken = default)
    {
        var ids = groupIds.Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        if (ids.Count == 0)
            return new Dictionary<Guid, string>();

        var result = new Dictionary<Guid, string>();
        foreach (var id in ids)
        {
            try
            {
                var name = await db.Database
                    .SqlQueryRaw<string>(
                        "SELECT CAST(NameEn AS varchar(max)) AS Value FROM CompanyServiceDB.dbo.Groups WHERE Id = {0}",
                        id)
                    .FirstOrDefaultAsync(cancellationToken);
                if (!string.IsNullOrWhiteSpace(name))
                    result[id] = name;
            }
            catch
            {
                // Company DB unavailable in some environments
            }
        }

        return result;
    }
}
