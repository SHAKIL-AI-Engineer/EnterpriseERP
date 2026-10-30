using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameEmployeeCodeToPunchNumberAndAddEmployeeID : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmployeeID",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PunchNumber",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE e SET PunchNumber = TRY_CAST(e.EmployeeCode AS int)
                FROM Employees e
                WHERE TRY_CAST(e.EmployeeCode AS int) IS NOT NULL AND TRY_CAST(e.EmployeeCode AS int) > 0;

                UPDATE e SET EmployeeID = LTRIM(RTRIM(e.EmployeeCode))
                FROM Employees e
                WHERE e.EmployeeCode LIKE 'EMP-%';

                UPDATE e SET EmployeeID = 'EMP-' + RIGHT('0000' + CAST(e.PunchNumber AS varchar(10)), 4)
                FROM Employees e
                WHERE e.EmployeeID IS NULL AND e.PunchNumber IS NOT NULL AND e.PunchNumber > 0;

                UPDATE e SET PunchNumber = 1, EmployeeID = 'EMP-0001'
                FROM Employees e
                WHERE e.PunchNumber IS NULL OR e.PunchNumber <= 0 OR e.EmployeeID IS NULL OR LTRIM(RTRIM(e.EmployeeID)) = '';
                """);

            migrationBuilder.DropIndex(
                name: "IX_Employees_CompanyId_EmployeeCode",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmployeeCode",
                table: "Employees");

            migrationBuilder.AlterColumn<string>(
                name: "EmployeeID",
                table: "Employees",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "PunchNumber",
                table: "Employees",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CompanyId_EmployeeID",
                table: "Employees",
                columns: new[] { "CompanyId", "EmployeeID" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CompanyId_PunchNumber",
                table: "Employees",
                columns: new[] { "CompanyId", "PunchNumber" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Employees_CompanyId_EmployeeID",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_CompanyId_PunchNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmployeeID",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PunchNumber",
                table: "Employees");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeCode",
                table: "Employees",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CompanyId_EmployeeCode",
                table: "Employees",
                columns: new[] { "CompanyId", "EmployeeCode" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }
    }
}
