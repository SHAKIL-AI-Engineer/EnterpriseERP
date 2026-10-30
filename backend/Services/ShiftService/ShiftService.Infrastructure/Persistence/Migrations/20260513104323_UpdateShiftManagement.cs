using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShiftService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateShiftManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "ShiftAssignments",
                newName: "IsTemporary");

            migrationBuilder.RenameColumn(
                name: "EndDate",
                table: "ShiftAssignments",
                newName: "ToDate");

            migrationBuilder.RenameColumn(
                name: "EffectiveDate",
                table: "ShiftAssignments",
                newName: "FromDate");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Shifts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<TimeSpan>(
                name: "BreakStartTime",
                table: "Shifts",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ColorCode",
                table: "Shifts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CompanyId",
                table: "Shifts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "EarlyLeaveGraceMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsOTEnabled",
                table: "Shifts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "MaxLateAllowedMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "NameBn",
                table: "Shifts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "OTStartAfterMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Remarks",
                table: "ShiftAssignments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ShiftRotations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NameBn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftRotations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShiftRotationRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RotationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShiftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    DurationDays = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftRotationRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftRotationRules_ShiftRotations_RotationId",
                        column: x => x.RotationId,
                        principalTable: "ShiftRotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShiftRotationRules_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_CompanyId_Name",
                table: "Shifts",
                columns: new[] { "CompanyId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShiftAssignments_EmployeeId_FromDate",
                table: "ShiftAssignments",
                columns: new[] { "EmployeeId", "FromDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ShiftRotationRules_RotationId",
                table: "ShiftRotationRules",
                column: "RotationId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftRotationRules_ShiftId",
                table: "ShiftRotationRules",
                column: "ShiftId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShiftRotationRules");

            migrationBuilder.DropTable(
                name: "ShiftRotations");

            migrationBuilder.DropIndex(
                name: "IX_Shifts_CompanyId_Name",
                table: "Shifts");

            migrationBuilder.DropIndex(
                name: "IX_ShiftAssignments_EmployeeId_FromDate",
                table: "ShiftAssignments");

            migrationBuilder.DropColumn(
                name: "BreakStartTime",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "ColorCode",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "EarlyLeaveGraceMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "IsOTEnabled",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "MaxLateAllowedMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "NameBn",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "OTStartAfterMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "Remarks",
                table: "ShiftAssignments");

            migrationBuilder.RenameColumn(
                name: "ToDate",
                table: "ShiftAssignments",
                newName: "EndDate");

            migrationBuilder.RenameColumn(
                name: "IsTemporary",
                table: "ShiftAssignments",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "FromDate",
                table: "ShiftAssignments",
                newName: "EffectiveDate");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Shifts",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);
        }
    }
}
