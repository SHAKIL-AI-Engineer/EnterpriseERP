using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.Infrastructure.Erp.Auth.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountApprovalWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(AuthService.Infrastructure.Persistence.AccountApprovalSchema.Sql);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountApprovals",
                schema: "administrator");
        }
    }
}
