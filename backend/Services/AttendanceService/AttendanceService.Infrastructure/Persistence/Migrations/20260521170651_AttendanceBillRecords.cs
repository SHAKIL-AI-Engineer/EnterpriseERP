using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AttendanceBillRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AttendanceBillRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HrEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PunchNumber = table.Column<int>(type: "int", nullable: false),
                    EmployeeID = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmployeeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Department = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Designation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BillType = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BillDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TiffinCount = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShiftName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CompanyName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InTime = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OutTime = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceBillRecords", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceBillRecords_CompanyId_BillType_BillDate",
                table: "AttendanceBillRecords",
                columns: new[] { "CompanyId", "BillType", "BillDate" });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceBillRecords_CompanyId_HrEmployeeId_BillType_BillDate",
                table: "AttendanceBillRecords",
                columns: new[] { "CompanyId", "HrEmployeeId", "BillType", "BillDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AttendanceBillRecords");
        }
    }
}
