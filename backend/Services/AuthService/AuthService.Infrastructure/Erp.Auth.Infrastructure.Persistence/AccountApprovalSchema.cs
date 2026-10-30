using Microsoft.EntityFrameworkCore;
namespace AuthService.Infrastructure.Persistence;
public static class AccountApprovalSchema
{
    public const string Sql = """
        IF SCHEMA_ID(N'administrator') IS NULL EXEC(N'CREATE SCHEMA administrator');
        IF OBJECT_ID(N'administrator.AccountApprovals', N'U') IS NULL
        BEGIN
          CREATE TABLE administrator.AccountApprovals (
            Id uniqueidentifier NOT NULL PRIMARY KEY, UserId uniqueidentifier NOT NULL UNIQUE,
            RequestedBy uniqueidentifier NOT NULL, RequestedAt datetimeoffset NOT NULL,
            RolesJson nvarchar(max) NOT NULL, CompaniesJson nvarchar(max) NOT NULL,
            Status nvarchar(20) NOT NULL, ReviewedBy uniqueidentifier NULL, ReviewedAt datetimeoffset NULL,
            Reason nvarchar(2000) NOT NULL, Version rowversion NOT NULL
          );
        END;
        """;
    public static Task EnsureAsync(AuthDbContext db) => db.Database.ExecuteSqlRawAsync(Sql);
}
