using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CuttingService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCuttingBundleListIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_CuttingBundles_CompanyId_OrderId",
                table: "CuttingBundles",
                columns: new[] { "CompanyId", "OrderId" });

            migrationBuilder.CreateIndex(
                name: "IX_CuttingBundles_CompanyId_Status_CreatedAt",
                table: "CuttingBundles",
                columns: new[] { "CompanyId", "Status", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CuttingBundles_CompanyId_OrderId",
                table: "CuttingBundles");

            migrationBuilder.DropIndex(
                name: "IX_CuttingBundles_CompanyId_Status_CreatedAt",
                table: "CuttingBundles");
        }
    }
}
