using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CuttingService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCuttingBundles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CuttingBundles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingLayId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CuttingOutputId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    BundleTag = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PlanNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    StyleName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SizeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PieceCount = table.Column<int>(type: "int", nullable: false),
                    SerialFrom = table.Column<int>(type: "int", nullable: true),
                    SerialTo = table.Column<int>(type: "int", nullable: true),
                    SerialRange = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    WeightKg = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    CurrentLocation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Ready"),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingBundles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuttingBundles_CuttingPlans_CuttingPlanId",
                        column: x => x.CuttingPlanId,
                        principalTable: "CuttingPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CuttingBundles_CompanyId",
                table: "CuttingBundles",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingBundles_CompanyId_BundleTag",
                table: "CuttingBundles",
                columns: new[] { "CompanyId", "BundleTag" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuttingBundles_CuttingPlanId",
                table: "CuttingBundles",
                column: "CuttingPlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CuttingBundles");
        }
    }
}
