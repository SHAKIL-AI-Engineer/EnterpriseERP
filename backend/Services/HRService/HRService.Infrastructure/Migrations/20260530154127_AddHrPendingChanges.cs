using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHrPendingChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeeJobInfos_EmployeeId",
                table: "EmployeeJobInfos");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeJobInfos_EmployeeId_IsCurrent",
                table: "EmployeeJobInfos",
                columns: new[] { "EmployeeId", "IsCurrent" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeeJobInfos_EmployeeId_IsCurrent",
                table: "EmployeeJobInfos");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeJobInfos_EmployeeId",
                table: "EmployeeJobInfos",
                column: "EmployeeId");
        }
    }
}
