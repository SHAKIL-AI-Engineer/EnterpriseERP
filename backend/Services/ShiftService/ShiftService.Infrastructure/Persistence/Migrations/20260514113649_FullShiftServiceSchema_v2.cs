using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShiftService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FullShiftServiceSchema_v2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Holidays");

            migrationBuilder.DropTable(
                name: "ShiftAssignments");

            migrationBuilder.DropTable(
                name: "ShiftAuditLogs");

            migrationBuilder.DropTable(
                name: "ShiftRotationRules");

            migrationBuilder.DropTable(
                name: "ShiftRotations");

            migrationBuilder.DropIndex(
                name: "IX_Shifts_CompanyId_Name",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "BreakDurationMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "BreakStartTime",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "ColorCode",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "EarlyLeaveGraceMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "IsBreakPaid",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "LateGracePeriodMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "MaxLateAllowedMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "MaxOTAllowedMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "MinimumOTMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "NameBn",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "OTStartAfterMinutes",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "Remarks",
                table: "Shifts");

            migrationBuilder.RenameColumn(
                name: "IsOTEnabled",
                table: "Shifts",
                newName: "IsGeneralDuty");

            migrationBuilder.RenameColumn(
                name: "IsNightShift",
                table: "Shifts",
                newName: "IsDefault");

            migrationBuilder.RenameColumn(
                name: "Code",
                table: "Shifts",
                newName: "ShiftCode");

            migrationBuilder.AddColumn<string>(
                name: "ShiftName",
                table: "Shifts",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "EmployeeShiftAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShiftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsCurrent = table.Column<bool>(type: "bit", nullable: false),
                    AssignedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeShiftAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeeShiftAssignments_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShiftBreaks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShiftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BreakName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BreakStartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    BreakEndTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    BreakMinutes = table.Column<int>(type: "int", nullable: false),
                    IsPaidBreak = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftBreaks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftBreaks_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShiftCalendars",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ShiftId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CalendarDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DayType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftCalendars", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShiftRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShiftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InGraceMinutes = table.Column<int>(type: "int", nullable: false),
                    OutGraceMinutes = table.Column<int>(type: "int", nullable: false),
                    LateAfterMinutes = table.Column<int>(type: "int", nullable: false),
                    EarlyOutBeforeMinutes = table.Column<int>(type: "int", nullable: false),
                    MinimumWorkingMinutes = table.Column<int>(type: "int", nullable: false),
                    HalfDayWorkingMinutes = table.Column<int>(type: "int", nullable: false),
                    AllowOvertime = table.Column<bool>(type: "bit", nullable: false),
                    OvertimeStartAfterMinutes = table.Column<int>(type: "int", nullable: false),
                    MinimumOvertimeMinutes = table.Column<int>(type: "int", nullable: false),
                    MaximumOvertimeMinutes = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftRules_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TemporaryShiftAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShiftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShiftDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemporaryShiftAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemporaryShiftAssignments_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Shifts",
                columns: new[] { "Id", "CompanyId", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "EndTime", "IsActive", "IsCrossDay", "IsDefault", "IsDeleted", "IsGeneralDuty", "ShiftCode", "ShiftName", "ShiftType", "StartTime", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"), new Guid("22222222-2222-2222-2222-222222222222"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new TimeSpan(0, 17, 0, 0, 0), true, false, true, false, true, "EKUSHE_GENERAL", "Ekushe General Duty", "GeneralDuty", new TimeSpan(0, 8, 0, 0, 0), null, null },
                    { new Guid("b1c2d3e4-f5a6-4a7b-8c9d-0e1f2a3b4c5d"), new Guid("33333333-3333-3333-3333-333333333333"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new TimeSpan(0, 20, 0, 0, 0), true, false, false, false, false, "DYEING_DAY", "Dyeing Day Shift", "Day", new TimeSpan(0, 8, 0, 0, 0), null, null },
                    { new Guid("c1d2e3f4-a5b6-4a7b-8c9d-0e1f2a3b4c5d"), new Guid("33333333-3333-3333-3333-333333333333"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new TimeSpan(0, 8, 0, 0, 0), true, true, false, false, false, "DYEING_NIGHT", "Dyeing Night Shift", "Night", new TimeSpan(0, 20, 0, 0, 0), null, null },
                    { new Guid("f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5d"), new Guid("11111111-1111-1111-1111-111111111111"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new TimeSpan(0, 17, 0, 0, 0), true, false, true, false, true, "UNITY_GENERAL", "Unity General Duty", "GeneralDuty", new TimeSpan(0, 8, 0, 0, 0), null, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_CompanyId_ShiftCode",
                table: "Shifts",
                columns: new[] { "CompanyId", "ShiftCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeShiftAssignments_CompanyId_EmployeeId_IsCurrent",
                table: "EmployeeShiftAssignments",
                columns: new[] { "CompanyId", "EmployeeId", "IsCurrent" });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeShiftAssignments_ShiftId",
                table: "EmployeeShiftAssignments",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftBreaks_ShiftId",
                table: "ShiftBreaks",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftRules_ShiftId",
                table: "ShiftRules",
                column: "ShiftId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TemporaryShiftAssignments_EmployeeId_ShiftDate",
                table: "TemporaryShiftAssignments",
                columns: new[] { "EmployeeId", "ShiftDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TemporaryShiftAssignments_ShiftId",
                table: "TemporaryShiftAssignments",
                column: "ShiftId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmployeeShiftAssignments");

            migrationBuilder.DropTable(
                name: "ShiftBreaks");

            migrationBuilder.DropTable(
                name: "ShiftCalendars");

            migrationBuilder.DropTable(
                name: "ShiftRules");

            migrationBuilder.DropTable(
                name: "TemporaryShiftAssignments");

            migrationBuilder.DropIndex(
                name: "IX_Shifts_CompanyId_ShiftCode",
                table: "Shifts");

            migrationBuilder.DeleteData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"));

            migrationBuilder.DeleteData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("b1c2d3e4-f5a6-4a7b-8c9d-0e1f2a3b4c5d"));

            migrationBuilder.DeleteData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("c1d2e3f4-a5b6-4a7b-8c9d-0e1f2a3b4c5d"));

            migrationBuilder.DeleteData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5d"));

            migrationBuilder.DropColumn(
                name: "ShiftName",
                table: "Shifts");

            migrationBuilder.RenameColumn(
                name: "ShiftCode",
                table: "Shifts",
                newName: "Code");

            migrationBuilder.RenameColumn(
                name: "IsGeneralDuty",
                table: "Shifts",
                newName: "IsOTEnabled");

            migrationBuilder.RenameColumn(
                name: "IsDefault",
                table: "Shifts",
                newName: "IsNightShift");

            migrationBuilder.AddColumn<int>(
                name: "BreakDurationMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

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

            migrationBuilder.AddColumn<int>(
                name: "EarlyLeaveGraceMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsBreakPaid",
                table: "Shifts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "LateGracePeriodMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxLateAllowedMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxOTAllowedMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinimumOTMinutes",
                table: "Shifts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Shifts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

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
                table: "Shifts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Holidays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsRecurring = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NameBn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Holidays", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShiftAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShiftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FromDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsTemporary = table.Column<bool>(type: "bit", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ToDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftAssignments_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShiftAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ChangeDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ChangedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EntityType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewState = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PreviousState = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftAuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShiftRotations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NameBn = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
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
                    ShiftId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DurationDays = table.Column<int>(type: "int", nullable: false),
                    RotationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sequence = table.Column<int>(type: "int", nullable: false)
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
                name: "IX_Holidays_CompanyId_Date",
                table: "Holidays",
                columns: new[] { "CompanyId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_ShiftAssignments_EmployeeId_FromDate",
                table: "ShiftAssignments",
                columns: new[] { "EmployeeId", "FromDate" });

            migrationBuilder.CreateIndex(
                name: "IX_ShiftAssignments_ShiftId",
                table: "ShiftAssignments",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftAuditLogs_CompanyId",
                table: "ShiftAuditLogs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftRotationRules_RotationId",
                table: "ShiftRotationRules",
                column: "RotationId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftRotationRules_ShiftId",
                table: "ShiftRotationRules",
                column: "ShiftId");
        }
    }
}
