using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace Erp.BuildingBlocks.CommonSecurity;

/// <summary>
/// Loads assigned company GUIDs from Auth DB so tenant enforcement matches platform host behavior.
/// Falls back to JWT claims when AuthDb connection string is not configured.
/// </summary>
public sealed class AuthDbTenantCompanyAccessResolver(IConfiguration configuration) : ITenantCompanyAccessResolver
{
    public async Task<TenantCompanyAccessSnapshot?> GetForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var connectionString = configuration.GetConnectionString("AuthDb");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return null;
        }

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = connection.CreateCommand();
        command.CommandText = """
            SELECT CompanyGuid, IsDefaultCompany
            FROM UserCompanyAccesses
            WHERE UserId = @userId
              AND IsActive = 1
              AND IsDeleted = 0
              AND CompanyGuid <> '00000000-0000-0000-0000-000000000000'
            ORDER BY IsDefaultCompany DESC, CompanyGuid
            """;
        command.Parameters.Add(new SqlParameter("@userId", userId));

        var companyIds = new List<Guid>();
        Guid? defaultCompanyId = null;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var companyGuid = reader.GetGuid(0);
            var isDefault = reader.GetBoolean(1);
            companyIds.Add(companyGuid);
            if (isDefault && defaultCompanyId is null)
            {
                defaultCompanyId = companyGuid;
            }
        }

        if (companyIds.Count == 0)
        {
            return null;
        }

        return new TenantCompanyAccessSnapshot(
            companyIds.Distinct().ToList(),
            defaultCompanyId ?? companyIds[0]);
    }
}
