using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAttendanceFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "DailyAttendances",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedBy",
                table: "DailyAttendances",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "DailyAttendances",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsManualIn",
                table: "DailyAttendances",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsManualOut",
                table: "DailyAttendances",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "ApprovedBy",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "IsManualIn",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "IsManualOut",
                table: "DailyAttendances");
        }
    }
}
