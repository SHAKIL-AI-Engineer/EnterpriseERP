using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShiftService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [Migration("20260518124000_TightenShiftAssignmentCompanyScope")]
    public partial class TightenShiftAssignmentCompanyScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TemporaryShiftAssignments_EmployeeId_ShiftDate",
                table: "TemporaryShiftAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_TemporaryShiftAssignments_CompanyId_EmployeeId_ShiftDate",
                table: "TemporaryShiftAssignments",
                columns: new[] { "CompanyId", "EmployeeId", "ShiftDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeShiftAssignments_CompanyId_EmployeeId",
                table: "EmployeeShiftAssignments",
                columns: new[] { "CompanyId", "EmployeeId" },
                unique: true,
                filter: "[IsCurrent] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TemporaryShiftAssignments_CompanyId_EmployeeId_ShiftDate",
                table: "TemporaryShiftAssignments");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeShiftAssignments_CompanyId_EmployeeId",
                table: "EmployeeShiftAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_TemporaryShiftAssignments_EmployeeId_ShiftDate",
                table: "TemporaryShiftAssignments",
                columns: new[] { "EmployeeId", "ShiftDate" },
                unique: true);
        }
    }
}
