using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOrganogramCodeColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Sections_DepartmentId",
                table: "Sections");

            migrationBuilder.DropIndex(
                name: "IX_Lines_SectionId",
                table: "Lines");

            migrationBuilder.DropIndex(
                name: "IX_Designations_SectionId",
                table: "Designations");

            migrationBuilder.DropIndex(
                name: "IX_Departments_CompanyId",
                table: "Departments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Sections_DepartmentId",
                table: "Sections",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Lines_SectionId",
                table: "Lines",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_Designations_SectionId",
                table: "Designations",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_CompanyId",
                table: "Departments",
                column: "CompanyId");
        }
    }
}
