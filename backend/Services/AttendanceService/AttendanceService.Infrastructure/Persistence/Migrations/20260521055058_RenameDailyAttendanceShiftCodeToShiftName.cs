using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameDailyAttendanceShiftCodeToShiftName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ShiftCode",
                table: "DailyAttendances",
                newName: "ShiftName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ShiftName",
                table: "DailyAttendances",
                newName: "ShiftCode");
        }
    }
}
