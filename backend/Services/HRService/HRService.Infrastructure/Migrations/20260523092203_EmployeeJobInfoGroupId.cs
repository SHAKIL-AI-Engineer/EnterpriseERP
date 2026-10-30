using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EmployeeJobInfoGroupId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GroupId",
                table: "EmployeeJobInfos",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "EmployeeJobInfos");
        }
    }
}
