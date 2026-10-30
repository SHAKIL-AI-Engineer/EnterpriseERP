using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncAttendanceModel_20260514 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PunchMode",
                table: "DeviceLogs");

            migrationBuilder.DropColumn(
                name: "IsHoliday",
                table: "DailyAttendances");

            migrationBuilder.RenameColumn(
                name: "IsWeeklyOff",
                table: "DailyAttendances",
                newName: "IsPayrollLocked");

            migrationBuilder.RenameColumn(
                name: "IsLeave",
                table: "DailyAttendances",
                newName: "IsManualAdjusted");

            migrationBuilder.AddColumn<int>(
                name: "BreakMinutes",
                table: "DailyAttendances",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DayType",
                table: "DailyAttendances",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OvertimeMinutes",
                table: "DailyAttendances",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BreakMinutes",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "DayType",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "OvertimeMinutes",
                table: "DailyAttendances");

            migrationBuilder.RenameColumn(
                name: "IsPayrollLocked",
                table: "DailyAttendances",
                newName: "IsWeeklyOff");

            migrationBuilder.RenameColumn(
                name: "IsManualAdjusted",
                table: "DailyAttendances",
                newName: "IsLeave");

            migrationBuilder.AddColumn<string>(
                name: "PunchMode",
                table: "DeviceLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsHoliday",
                table: "DailyAttendances",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
