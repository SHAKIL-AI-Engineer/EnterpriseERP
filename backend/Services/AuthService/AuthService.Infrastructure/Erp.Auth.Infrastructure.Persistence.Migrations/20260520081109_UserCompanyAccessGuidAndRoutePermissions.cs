using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.Infrastructure.Erp.Auth.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UserCompanyAccessGuidAndRoutePermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserCompanyAccesses_UserId_CompanyId' AND object_id = OBJECT_ID('UserCompanyAccesses'))
                    DROP INDEX [IX_UserCompanyAccesses_UserId_CompanyId] ON [UserCompanyAccesses];
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('UserCompanyAccesses', 'CompanyId') IS NOT NULL
                BEGIN
                    IF COL_LENGTH('UserCompanyAccesses', 'CompanyGuid') IS NULL
                        ALTER TABLE [UserCompanyAccesses] ADD [CompanyGuid] uniqueidentifier NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
                    ALTER TABLE [UserCompanyAccesses] DROP COLUMN [CompanyId];
                END
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_UserCompanyAccesses_UserId_CompanyGuid' AND object_id = OBJECT_ID('UserCompanyAccesses'))
                    CREATE UNIQUE INDEX [IX_UserCompanyAccesses_UserId_CompanyGuid] ON [UserCompanyAccesses] ([UserId], [CompanyGuid]);
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'RoutePermissions', N'U') IS NULL
                BEGIN
                    CREATE TABLE [RoutePermissions] (
                        [Id] uniqueidentifier NOT NULL,
                        [Module] nvarchar(64) NOT NULL,
                        [RoutePattern] nvarchar(512) NOT NULL,
                        [HttpMethod] nvarchar(16) NULL,
                        [PermissionCode] nvarchar(128) NOT NULL,
                        [IsMenuRoute] bit NOT NULL,
                        [CreatedAt] datetimeoffset NOT NULL,
                        [IsDeleted] bit NOT NULL,
                        CONSTRAINT [PK_RoutePermissions] PRIMARY KEY ([Id])
                    );
                    CREATE INDEX [IX_RoutePermissions_PermissionCode] ON [RoutePermissions] ([PermissionCode]);
                    CREATE INDEX [IX_RoutePermissions_RoutePattern] ON [RoutePermissions] ([RoutePattern]);
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "RoutePermissions");

            migrationBuilder.DropIndex(
                name: "IX_UserCompanyAccesses_UserId_CompanyGuid",
                table: "UserCompanyAccesses");

            migrationBuilder.DropColumn(
                name: "CompanyGuid",
                table: "UserCompanyAccesses");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "UserCompanyAccesses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_UserCompanyAccesses_UserId_CompanyId",
                table: "UserCompanyAccesses",
                columns: new[] { "UserId", "CompanyId" },
                unique: true);
        }
    }
}
