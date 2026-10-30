using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PayrollService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PayrollPolicyTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppliedPolicyCode",
                table: "PayrollRuns",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AppliedPolicyVersion",
                table: "PayrollRuns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AppliedPolicyCode",
                table: "EmployeePayrolls",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AppliedPolicySnapshotJson",
                table: "EmployeePayrolls",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AppliedPolicyVersion",
                table: "EmployeePayrolls",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ConveyanceAllowance",
                table: "EmployeePayrolls",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FoodAllowance",
                table: "EmployeePayrolls",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "HouseRent",
                table: "EmployeePayrolls",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MedicalAllowance",
                table: "EmployeePayrolls",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "PayrollPolicyTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PolicyCode = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    PolicyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    ComplianceMode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FixedMedical = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    FixedFood = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    FixedConveyance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    BasicDivisor = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    OtBase = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    OtDivisor = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    OtMultiplier = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AbsentBase = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AbsentDayDivisor = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    FixedAbsentDays = table.Column<int>(type: "int", nullable: true),
                    MonthDayCalculationType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    FixedMonthDays = table.Column<int>(type: "int", nullable: true),
                    RequireAttendanceApproval = table.Column<bool>(type: "bit", nullable: false),
                    AllowAbsentDeduction = table.Column<bool>(type: "bit", nullable: false),
                    AllowLateDeduction = table.Column<bool>(type: "bit", nullable: false),
                    AllowOvertime = table.Column<bool>(type: "bit", nullable: false),
                    AllowTiffinBill = table.Column<bool>(type: "bit", nullable: false),
                    AllowNightBill = table.Column<bool>(type: "bit", nullable: false),
                    AllowAttendanceBonus = table.Column<bool>(type: "bit", nullable: false),
                    AllowEarnLeaveEncashment = table.Column<bool>(type: "bit", nullable: false),
                    AllowFestivalBonus = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollPolicyTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CompanyPayrollPolicyAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PolicyTemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FixedOvertimeRate = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    AssignedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyPayrollPolicyAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompanyPayrollPolicyAssignments_PayrollPolicyTemplates_PolicyTemplateId",
                        column: x => x.PolicyTemplateId,
                        principalTable: "PayrollPolicyTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "PayrollPolicyTemplates",
                columns: new[] { "Id", "AbsentBase", "AbsentDayDivisor", "AllowAbsentDeduction", "AllowAttendanceBonus", "AllowEarnLeaveEncashment", "AllowFestivalBonus", "AllowLateDeduction", "AllowNightBill", "AllowOvertime", "AllowTiffinBill", "BasicDivisor", "ComplianceMode", "CreatedAt", "FixedAbsentDays", "FixedConveyance", "FixedFood", "FixedMedical", "FixedMonthDays", "MonthDayCalculationType", "OtBase", "OtDivisor", "OtMultiplier", "PolicyCode", "PolicyName", "RequireAttendanceApproval", "Status", "Version" },
                values: new object[,]
                {
                    { new Guid("a1000001-0000-0000-0000-000000000001"), "Basic", "FixedDays", true, false, true, true, false, false, true, false, 1.5m, "FullCompliance", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 30, 450m, 1250m, 750m, 30, "FixedDays", "Basic", 208m, 2m, "BDT_COMPLIANCE_V1", "Bangladesh Full Compliance Salary Rule", true, "Active", 1 },
                    { new Guid("a1000002-0000-0000-0000-000000000002"), "Gross", "CalendarDays", true, false, true, true, false, false, true, false, 1.5m, "NonCompliance", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 30, 450m, 1250m, 750m, 30, "CalendarDays", "Gross", 208m, 2m, "BDT_NONCOMPLIANCE_GROSS_OT_V1", "Non-Compliance Gross OT", false, "Active", 1 },
                    { new Guid("a1000003-0000-0000-0000-000000000003"), "Gross", "CalendarDays", true, false, true, true, false, false, true, false, 1.5m, "NonCompliance", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 30, 450m, 1250m, 750m, 30, "CalendarDays", "Gross", 240m, 1.5m, "BDT_NONCOMPLIANCE_GROSS240_OT_V1", "Non-Compliance Gross 240 OT", false, "Active", 1 },
                    { new Guid("a1000004-0000-0000-0000-000000000004"), "Gross", "CalendarDays", true, false, true, true, false, false, true, false, 1.5m, "NonCompliance", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 30, 450m, 1250m, 750m, 30, "CalendarDays", "Fixed", 208m, 2m, "BDT_NONCOMPLIANCE_FIXED_OT_V1", "Non-Compliance Fixed OT Rate", false, "Active", 1 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyPayrollPolicyAssignments_CompanyId_IsActive",
                table: "CompanyPayrollPolicyAssignments",
                columns: new[] { "CompanyId", "IsActive" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyPayrollPolicyAssignments_PolicyTemplateId",
                table: "CompanyPayrollPolicyAssignments",
                column: "PolicyTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_PayrollPolicyTemplates_PolicyCode",
                table: "PayrollPolicyTemplates",
                column: "PolicyCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanyPayrollPolicyAssignments");

            migrationBuilder.DropTable(
                name: "PayrollPolicyTemplates");

            migrationBuilder.DropColumn(
                name: "AppliedPolicyCode",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "AppliedPolicyVersion",
                table: "PayrollRuns");

            migrationBuilder.DropColumn(
                name: "AppliedPolicyCode",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "AppliedPolicySnapshotJson",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "AppliedPolicyVersion",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "ConveyanceAllowance",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "FoodAllowance",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "HouseRent",
                table: "EmployeePayrolls");

            migrationBuilder.DropColumn(
                name: "MedicalAllowance",
                table: "EmployeePayrolls");
        }
    }
}
