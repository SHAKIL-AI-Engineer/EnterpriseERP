using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PayrollService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DirectSalaryProcessing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PayrollApprovals");

            migrationBuilder.DropTable(
                name: "PayrollLocks");

            migrationBuilder.DropTable(
                name: "PayrollPeriods");

            migrationBuilder.DropTable(
                name: "PayrollPolicies");

            migrationBuilder.DropIndex(
                name: "IX_PayrollRuns_PayrollPeriodId_RunNo",
                table: "PayrollRuns");

            migrationBuilder.DropIndex(
                name: "IX_EmployeePayrolls_CompanyId_PayrollPeriodId_EmployeeId",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "PayrollPeriodId",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "PayrollPeriodId",
                table: "EmployeePayrolls");

            migrationBuilder.AddColumn<DateOnly>(
                name: "EndDate",
                table: "PayrollRuns",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<decimal>(
                name: "FixedOvertimeRate",
                table: "PayrollRuns",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MonthNo",
                table: "PayrollRuns",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "OvertimeCalculationType",
                table: "PayrollRuns",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcessingMode",
                table: "PayrollRuns",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateOnly>(
                name: "StartDate",
                table: "PayrollRuns",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<int>(
                name: "YearNo",
                table: "PayrollRuns",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SalaryCalculationType",
                table: "EmployeeSalaries",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Monthly");

            migrationBuilder.AddColumn<int>(
                name: "MonthNo",
                table: "EmployeePayrolls",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "OvertimeCalculationType",
                table: "EmployeePayrolls",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcessingMode",
                table: "EmployeePayrolls",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "YearNo",
                table: "EmployeePayrolls",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_PayrollRuns_CompanyId_YearNo_MonthNo_RunNo",
                table: "PayrollRuns",
                columns: new[] { "CompanyId", "YearNo", "MonthNo", "RunNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeePayrolls_CompanyId_EmployeeId_YearNo_MonthNo",
                table: "EmployeePayrolls",
                columns: new[] { "CompanyId", "EmployeeId", "YearNo", "MonthNo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PayrollRuns_CompanyId_YearNo_MonthNo_RunNo",
                table: "PayrollRuns");

            migrationBuilder.DropIndex(
                name: "IX_EmployeePayrolls_CompanyId_EmployeeId_YearNo_MonthNo",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "FixedOvertimeRate",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "MonthNo",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "OvertimeCalculationType",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "ProcessingMode",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "YearNo",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "SalaryCalculationType",
                table: "EmployeeSalaries");

            migrationBuilder.DropColumn(
                name: "MonthNo",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "OvertimeCalculationType",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "ProcessingMode",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "YearNo",
                table: "EmployeePayrolls");

            migrationBuilder.AddColumn<Guid>(
                name: "PayrollPeriodId",
                table: "PayrollRuns",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "PayrollPeriodId",
                table: "EmployeePayrolls",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "PayrollApprovals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApprovalLevel = table.Column<int>(type: "int", nullable: false),
                    ApprovalStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ApprovedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PayrollPeriodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RejectedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollApprovals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PayrollLocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsLocked = table.Column<bool>(type: "bit", nullable: false),
                    LockedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LockedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PayrollPeriodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnlockReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UnlockedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UnlockedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollLocks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PayrollPeriods",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsAttendanceLocked = table.Column<bool>(type: "bit", nullable: false),
                    IsPayrollLocked = table.Column<bool>(type: "bit", nullable: false),
                    MonthNo = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Open"),
                    YearNo = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollPeriods", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PayrollPolicies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AllowAbsentDeduction = table.Column<bool>(type: "bit", nullable: false),
                    AllowAttendanceBonus = table.Column<bool>(type: "bit", nullable: false),
                    AllowEarnLeaveEncashment = table.Column<bool>(type: "bit", nullable: false),
                    AllowFestivalBonus = table.Column<bool>(type: "bit", nullable: false),
                    AllowLateDeduction = table.Column<bool>(type: "bit", nullable: false),
                    AllowNightBill = table.Column<bool>(type: "bit", nullable: false),
                    AllowOvertime = table.Column<bool>(type: "bit", nullable: false),
                    AllowTiffinBill = table.Column<bool>(type: "bit", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FixedMonthDays = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    LateDeductionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    MonthDayCalculationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    OvertimeCalculationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    OvertimeDivisor = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 208m),
                    OvertimeMultiplier = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 2m),
                    PolicyName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    SalaryCalculationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UseApprovedAttendanceOnly = table.Column<bool>(type: "bit", nullable: false),
                    UseAttendanceForSalary = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollPolicies", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PayrollPolicies",
                columns: new[] { "Id", "AllowAbsentDeduction", "AllowAttendanceBonus", "AllowEarnLeaveEncashment", "AllowFestivalBonus", "AllowLateDeduction", "AllowNightBill", "AllowOvertime", "AllowTiffinBill", "CompanyId", "CreatedAt", "FixedMonthDays", "IsActive", "LateDeductionType", "MonthDayCalculationType", "OvertimeCalculationType", "OvertimeDivisor", "OvertimeMultiplier", "PolicyName", "SalaryCalculationType", "UpdatedAt", "UseApprovedAttendanceOnly", "UseAttendanceForSalary" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), true, false, false, false, false, false, true, false, new Guid("20000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 30, true, null, "FixedDays", "BasicSalaryBased", 208m, 2m, "Unity General Duty Monthly", "Monthly", null, true, true },
                    { new Guid("10000000-0000-0000-0000-000000000002"), true, true, false, false, false, false, true, true, new Guid("20000000-0000-0000-0000-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, null, "CalendarDays", "BasicSalaryBased", 208m, 2m, "Ekushe General Duty Monthly", "Monthly", null, true, true },
                    { new Guid("10000000-0000-0000-0000-000000000003"), true, false, false, false, false, true, true, true, new Guid("20000000-0000-0000-0000-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 30, true, null, "FixedDays", "BasicSalaryBased", 208m, 2m, "Dyeing Shift Monthly", "Monthly", null, true, true }
                });

            migrationBuilder.CreateIndex(
                name: "IX_PayrollRuns_PayrollPeriodId_RunNo",
                table: "PayrollRuns",
                columns: new[] { "PayrollPeriodId", "RunNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeePayrolls_CompanyId_PayrollPeriodId_EmployeeId",
                table: "EmployeePayrolls",
                columns: new[] { "CompanyId", "PayrollPeriodId", "EmployeeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PayrollPeriods_CompanyId_YearNo_MonthNo",
                table: "PayrollPeriods",
                columns: new[] { "CompanyId", "YearNo", "MonthNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PayrollPolicies_CompanyId_PolicyName",
                table: "PayrollPolicies",
                columns: new[] { "CompanyId", "PolicyName" },
                unique: true);
        }
    }
}
