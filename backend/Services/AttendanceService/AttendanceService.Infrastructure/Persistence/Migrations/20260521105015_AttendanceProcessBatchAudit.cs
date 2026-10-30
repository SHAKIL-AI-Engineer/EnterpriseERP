using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AttendanceProcessBatchAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AttendanceProcessBatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProcessFromDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessToDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalEmployees = table.Column<int>(type: "int", nullable: false),
                    ProcessedEmployees = table.Column<int>(type: "int", nullable: false),
                    FailedEmployees = table.Column<int>(type: "int", nullable: false),
                    ProcessStatus = table.Column<int>(type: "int", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProcessedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceProcessBatches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceProcessErrors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AttendanceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceProcessErrors", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceProcessBatches_CompanyId_StartedAt",
                table: "AttendanceProcessBatches",
                columns: new[] { "CompanyId", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceProcessErrors_BatchId_AttendanceDate",
                table: "AttendanceProcessErrors",
                columns: new[] { "BatchId", "AttendanceDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AttendanceProcessBatches");

            migrationBuilder.DropTable(
                name: "AttendanceProcessErrors");
        }
    }
}
