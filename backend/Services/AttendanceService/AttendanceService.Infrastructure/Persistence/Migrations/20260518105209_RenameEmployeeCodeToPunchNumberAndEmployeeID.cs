using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AttendanceService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameEmployeeCodeToPunchNumberAndEmployeeID : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DeviceLogs_CompanyId_EmployeeCode_PunchTime",
                table: "DeviceLogs");

            migrationBuilder.DropIndex(
                name: "IX_DailyAttendances_CompanyId_EmployeeId_AttendanceDate",
                table: "DailyAttendances");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "DailyAttendances",
                newName: "HrEmployeeId");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "DeviceLogs",
                newName: "HrEmployeeId");

            migrationBuilder.AlterColumn<string>(
                name: "DeviceSerial",
                table: "DeviceLogs",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeID",
                table: "DeviceLogs",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PunchNumber",
                table: "DeviceLogs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeID",
                table: "DailyAttendances",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PunchNumber",
                table: "DailyAttendances",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.DeviceLogs', 'EmployeeCode') IS NOT NULL
                BEGIN
                    EXEC(N'
                        UPDATE l SET PunchNumber = TRY_CAST(l.EmployeeCode AS int)
                        FROM DeviceLogs l
                        WHERE TRY_CAST(l.EmployeeCode AS int) IS NOT NULL AND TRY_CAST(l.EmployeeCode AS int) > 0;

                        UPDATE l SET EmployeeID = LTRIM(RTRIM(l.EmployeeCode))
                        FROM DeviceLogs l
                        WHERE l.EmployeeCode LIKE ''EMP-%'';
                    ');
                END

                UPDATE l SET EmployeeID = 'EMP-' + RIGHT('0000' + CAST(l.PunchNumber AS varchar(10)), 4)
                FROM DeviceLogs l
                WHERE (l.EmployeeID IS NULL OR LTRIM(RTRIM(l.EmployeeID)) = '')
                  AND l.PunchNumber IS NOT NULL AND l.PunchNumber > 0;

                UPDATE l SET PunchNumber = 0, EmployeeID = ''
                FROM DeviceLogs l
                WHERE l.PunchNumber IS NULL;

                IF COL_LENGTH('dbo.DailyAttendances', 'EmployeeCode') IS NOT NULL
                BEGIN
                    EXEC(N'
                        UPDATE d SET PunchNumber = TRY_CAST(d.EmployeeCode AS int)
                        FROM DailyAttendances d
                        WHERE TRY_CAST(d.EmployeeCode AS int) IS NOT NULL AND TRY_CAST(d.EmployeeCode AS int) > 0;

                        UPDATE d SET EmployeeID = LTRIM(RTRIM(d.EmployeeCode))
                        FROM DailyAttendances d
                        WHERE d.EmployeeCode LIKE ''EMP-%'';
                    ');
                END

                IF DB_ID(N'HRServiceDB') IS NOT NULL AND OBJECT_ID(N'HRServiceDB.dbo.Employees', N'U') IS NOT NULL
                BEGIN
                    UPDATE d SET PunchNumber = e.PunchNumber, EmployeeID = e.EmployeeID
                    FROM DailyAttendances d
                    INNER JOIN HRServiceDB.dbo.Employees e ON e.Id = d.HrEmployeeId AND e.IsDeleted = 0
                    WHERE d.PunchNumber IS NULL OR d.EmployeeID IS NULL OR LTRIM(RTRIM(d.EmployeeID)) = '';
                END

                UPDATE d SET PunchNumber = 0, EmployeeID = ''
                FROM DailyAttendances d
                WHERE d.PunchNumber IS NULL OR d.EmployeeID IS NULL OR LTRIM(RTRIM(d.EmployeeID)) = '';
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.DeviceLogs', 'EmployeeCode') IS NOT NULL
                    ALTER TABLE dbo.DeviceLogs DROP COLUMN EmployeeCode;
                """);

            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DailyAttendances_CompanyId_EmployeeCode_AttendanceDate' AND object_id = OBJECT_ID('dbo.DailyAttendances'))
                    DROP INDEX IX_DailyAttendances_CompanyId_EmployeeCode_AttendanceDate ON dbo.DailyAttendances;

                DECLARE @df nvarchar(256);
                SELECT @df = d.name
                FROM sys.default_constraints d
                INNER JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
                WHERE d.parent_object_id = OBJECT_ID('dbo.DailyAttendances') AND c.name = 'EmployeeCode';
                IF @df IS NOT NULL EXEC('ALTER TABLE dbo.DailyAttendances DROP CONSTRAINT [' + @df + ']');

                IF COL_LENGTH('dbo.DailyAttendances', 'EmployeeCode') IS NOT NULL
                    ALTER TABLE dbo.DailyAttendances DROP COLUMN EmployeeCode;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "EmployeeID",
                table: "DeviceLogs",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "PunchNumber",
                table: "DeviceLogs",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "EmployeeID",
                table: "DailyAttendances",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(32)",
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "PunchNumber",
                table: "DailyAttendances",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeviceLogs_CompanyId_PunchNumber_PunchTime_DeviceSerial",
                table: "DeviceLogs",
                columns: new[] { "CompanyId", "PunchNumber", "PunchTime", "DeviceSerial" },
                unique: true,
                filter: "[DeviceSerial] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DailyAttendances_CompanyId_PunchNumber_AttendanceDate",
                table: "DailyAttendances",
                columns: new[] { "CompanyId", "PunchNumber", "AttendanceDate" });

            migrationBuilder.CreateIndex(
                name: "IX_DailyAttendances_CompanyId_HrEmployeeId_AttendanceDate",
                table: "DailyAttendances",
                columns: new[] { "CompanyId", "HrEmployeeId", "AttendanceDate" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DeviceLogs_CompanyId_PunchNumber_PunchTime_DeviceSerial",
                table: "DeviceLogs");

            migrationBuilder.DropIndex(
                name: "IX_DailyAttendances_CompanyId_PunchNumber_AttendanceDate",
                table: "DailyAttendances");

            migrationBuilder.DropIndex(
                name: "IX_DailyAttendances_CompanyId_HrEmployeeId_AttendanceDate",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "EmployeeID",
                table: "DeviceLogs");

            migrationBuilder.DropColumn(
                name: "PunchNumber",
                table: "DeviceLogs");

            migrationBuilder.DropColumn(
                name: "EmployeeID",
                table: "DailyAttendances");

            migrationBuilder.DropColumn(
                name: "PunchNumber",
                table: "DailyAttendances");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeCode",
                table: "DailyAttendances",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "DeviceSerial",
                table: "DeviceLogs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeCode",
                table: "DeviceLogs",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.RenameColumn(
                name: "HrEmployeeId",
                table: "DailyAttendances",
                newName: "EmployeeId");

            migrationBuilder.RenameColumn(
                name: "HrEmployeeId",
                table: "DeviceLogs",
                newName: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_DeviceLogs_CompanyId_EmployeeCode_PunchTime",
                table: "DeviceLogs",
                columns: new[] { "CompanyId", "EmployeeCode", "PunchTime" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DailyAttendances_CompanyId_EmployeeId_AttendanceDate",
                table: "DailyAttendances",
                columns: new[] { "CompanyId", "EmployeeId", "AttendanceDate" },
                unique: true);
        }
    }
}
