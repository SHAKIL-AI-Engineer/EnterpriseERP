using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShiftService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ShiftPolicyAndEvaluation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PunchWindowBeforeMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 60);

            migrationBuilder.AddColumn<int>(
                name: "ShiftCategory",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "DeductLunchFromWorking",
                table: "ShiftRules",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HolidayWorkAllAsOvertime",
                table: "ShiftRules",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "LunchBreakMinutes",
                table: "ShiftRules",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "WeeklyOffWorkAllAsOvertime",
                table: "ShiftRules",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "BreakType",
                table: "ShiftBreaks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"),
                columns: new[] { "PunchWindowBeforeMinutes", "ShiftCategory" },
                values: new object[] { 60, 0 });

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("b1c2d3e4-f5a6-4a7b-8c9d-0e1f2a3b4c5d"),
                columns: new[] { "PunchWindowBeforeMinutes", "ShiftCategory" },
                values: new object[] { 60, 1 });

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("c1d2e3f4-a5b6-4a7b-8c9d-0e1f2a3b4c5d"),
                columns: new[] { "PunchWindowBeforeMinutes", "ShiftCategory" },
                values: new object[] { 60, 2 });

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5d"),
                columns: new[] { "PunchWindowBeforeMinutes", "ShiftCategory" },
                values: new object[] { 60, 0 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PunchWindowBeforeMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "ShiftCategory",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "DeductLunchFromWorking",
                table: "ShiftRules");

            migrationBuilder.DropColumn(
                name: "HolidayWorkAllAsOvertime",
                table: "ShiftRules");

            migrationBuilder.DropColumn(
                name: "LunchBreakMinutes",
                table: "ShiftRules");

            migrationBuilder.DropColumn(
                name: "WeeklyOffWorkAllAsOvertime",
                table: "ShiftRules");

            migrationBuilder.DropColumn(
                name: "BreakType",
                table: "ShiftBreaks");
        }
    }
}
