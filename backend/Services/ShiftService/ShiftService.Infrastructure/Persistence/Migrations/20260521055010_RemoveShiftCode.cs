using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShiftService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveShiftCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Shifts_CompanyId_ShiftCode",
                table: "Shifts");

            migrationBuilder.DropColumn(
                name: "ShiftCode",
                table: "Shifts");

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_CompanyId_ShiftName",
                table: "Shifts",
                columns: new[] { "CompanyId", "ShiftName" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Shifts_CompanyId_ShiftName",
                table: "Shifts");

            migrationBuilder.AddColumn<string>(
                name: "ShiftCode",
                table: "Shifts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"),
                column: "ShiftCode",
                value: "EKUSHE_GENERAL");

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("b1c2d3e4-f5a6-4a7b-8c9d-0e1f2a3b4c5d"),
                column: "ShiftCode",
                value: "DYEING_DAY");

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("c1d2e3f4-a5b6-4a7b-8c9d-0e1f2a3b4c5d"),
                column: "ShiftCode",
                value: "DYEING_NIGHT");

            migrationBuilder.UpdateData(
                table: "Shifts",
                keyColumn: "Id",
                keyValue: new Guid("f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c5d"),
                column: "ShiftCode",
                value: "UNITY_GENERAL");

            migrationBuilder.CreateIndex(
                name: "IX_Shifts_CompanyId_ShiftCode",
                table: "Shifts",
                columns: new[] { "CompanyId", "ShiftCode" },
                unique: true);
        }
    }
}
