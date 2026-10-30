using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AttendancePunchRecordIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "InPunchId",
                table: "DailyAttendances",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OutPunchId",
                table: "DailyAttendances",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DailyAttendances_InPunchId",
                table: "DailyAttendances",
                column: "InPunchId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyAttendances_OutPunchId",
                table: "DailyAttendances",
                column: "OutPunchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DailyAttendances_InPunchId",
                table: "DailyAttendances");

            migrationBuilder.DropIndex(
                name: "IX_DailyAttendances_OutPunchId",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "InPunchId",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "OutPunchId",
                table: "DailyAttendances");
        }
    }
}
