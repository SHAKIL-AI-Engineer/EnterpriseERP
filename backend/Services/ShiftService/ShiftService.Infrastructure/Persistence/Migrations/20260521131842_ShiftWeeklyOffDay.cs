using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShiftService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ShiftWeeklyOffDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WeeklyOffDayOfWeek",
                table: "Shifts",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"),
                column: "WeeklyOffDayOfWeek",
                value: null);

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("b1c2d3e4-f5a6-4a7b-8c9d-0e1f2a3b4c5d"),
                column: "WeeklyOffDayOfWeek",
                value: null);

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("c1d2e3f4-a5b6-4a7b-8c9d-0e1f2a3b4c5d"),
                column: "WeeklyOffDayOfWeek",
                value: null);

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5d"),
                column: "WeeklyOffDayOfWeek",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WeeklyOffDayOfWeek",
                table: "Shifts");
        }
    }
}
