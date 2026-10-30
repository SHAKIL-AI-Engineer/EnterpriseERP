using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CuttingService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCuttingSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CuttingAuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingAuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CuttingBalances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ColorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SizeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    OrderQty = table.Column<int>(type: "int", nullable: false),
                    PlanQty = table.Column<int>(type: "int", nullable: false),
                    CutQty = table.Column<int>(type: "int", nullable: false),
                    TransferredQty = table.Column<int>(type: "int", nullable: false),
                    BalanceQty = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingBalances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CuttingPanelTransfers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransferNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TransferDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ToDepartment = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "Production"),
                    TotalTransferQty = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    ConfirmedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingPanelTransfers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CuttingPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StyleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PlanNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PlanDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ColorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TotalPlanQty = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    ApprovedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CuttingWastages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WastageDate = table.Column<DateOnly>(type: "date", nullable: false),
                    FabricItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    WastageQty = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    WastageReason = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingWastages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CuttingPanelTransferItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingPanelTransferId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ColorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SizeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TransferQty = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingPanelTransferItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuttingPanelTransferItems_CuttingPanelTransfers_CuttingPanelTransferId",
                        column: x => x.CuttingPanelTransferId,
                        principalTable: "CuttingPanelTransfers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CuttingLays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LayNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LayDate = table.Column<DateOnly>(type: "date", nullable: false),
                    MarkerNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    FabricLength = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    PlyQty = table.Column<int>(type: "int", nullable: false),
                    LayQty = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Open"),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingLays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuttingLays_CuttingPlans_CuttingPlanId",
                        column: x => x.CuttingPlanId,
                        principalTable: "CuttingPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CuttingPlanSizeBreakdowns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SizeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PlanQty = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingPlanSizeBreakdowns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuttingPlanSizeBreakdowns_CuttingPlans_CuttingPlanId",
                        column: x => x.CuttingPlanId,
                        principalTable: "CuttingPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FabricIssuesToCutting",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    InventoryIssueId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IssueNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IssueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    FabricItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IssueQty = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    UnitName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LotNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BatchNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ColorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Received"),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FabricIssuesToCutting", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FabricIssuesToCutting_CuttingPlans_CuttingPlanId",
                        column: x => x.CuttingPlanId,
                        principalTable: "CuttingPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CuttingLaySizeDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingLayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SizeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RatioQty = table.Column<int>(type: "int", nullable: false),
                    PlyQty = table.Column<int>(type: "int", nullable: false),
                    CutQty = table.Column<int>(type: "int", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingLaySizeDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuttingLaySizeDetails_CuttingLays_CuttingLayId",
                        column: x => x.CuttingLayId,
                        principalTable: "CuttingLays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CuttingOutputs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuttingLayId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OutputDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ColorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SizeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    OutputQty = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Created"),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuttingOutputs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuttingOutputs_CuttingLays_CuttingLayId",
                        column: x => x.CuttingLayId,
                        principalTable: "CuttingLays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CuttingOutputs_CuttingPlans_CuttingPlanId",
                        column: x => x.CuttingPlanId,
                        principalTable: "CuttingPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "CuttingPlans",
                columns: new[] { "Id", "ApprovedAt", "ApprovedBy", "ColorName", "CompanyId", "CompletedAt", "CreatedAt", "CreatedBy", "OrderId", "PlanDate", "PlanNo", "Status", "StyleId", "TotalPlanQty", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new Guid("41000000-0000-0000-0000-000000000001"), null, null, "Black", new Guid("20000000-0000-0000-0000-000000000001"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new Guid("40000000-0000-0000-0000-000000000001"), new DateOnly(2026, 5, 16), "CP-0001", "Draft", null, 1000, null, null });

            migrationBuilder.InsertData(
                table: "CuttingPlanSizeBreakdowns",
                columns: new[] { "Id", "CompanyId", "CreatedAt", "CreatedBy", "CuttingPlanId", "PlanQty", "SizeName", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new Guid("42000000-0000-0000-0000-000000000001"), new Guid("20000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new Guid("41000000-0000-0000-0000-000000000001"), 1000, "M", null, null });

            migrationBuilder.CreateIndex(
                name: "IX_CuttingBalances_CompanyId_OrderId_ColorName_SizeName",
                table: "CuttingBalances",
                columns: new[] { "CompanyId", "OrderId", "ColorName", "SizeName" },
                unique: true,
                filter: "[ColorName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingLays_CompanyId",
                table: "CuttingLays",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingLays_CompanyId_CuttingPlanId_LayNo",
                table: "CuttingLays",
                columns: new[] { "CompanyId", "CuttingPlanId", "LayNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuttingLays_CuttingPlanId",
                table: "CuttingLays",
                column: "CuttingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingLaySizeDetails_CompanyId",
                table: "CuttingLaySizeDetails",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingLaySizeDetails_CuttingLayId",
                table: "CuttingLaySizeDetails",
                column: "CuttingLayId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingOutputs_CompanyId",
                table: "CuttingOutputs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingOutputs_CompanyId_OrderId_CuttingPlanId",
                table: "CuttingOutputs",
                columns: new[] { "CompanyId", "OrderId", "CuttingPlanId" });

            migrationBuilder.CreateIndex(
                name: "IX_CuttingOutputs_CuttingLayId",
                table: "CuttingOutputs",
                column: "CuttingLayId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingOutputs_CuttingPlanId",
                table: "CuttingOutputs",
                column: "CuttingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingPanelTransferItems_CompanyId",
                table: "CuttingPanelTransferItems",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingPanelTransferItems_CuttingPanelTransferId",
                table: "CuttingPanelTransferItems",
                column: "CuttingPanelTransferId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingPanelTransfers_CompanyId",
                table: "CuttingPanelTransfers",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingPanelTransfers_CompanyId_TransferNo",
                table: "CuttingPanelTransfers",
                columns: new[] { "CompanyId", "TransferNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuttingPlans_CompanyId",
                table: "CuttingPlans",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingPlans_CompanyId_PlanNo",
                table: "CuttingPlans",
                columns: new[] { "CompanyId", "PlanNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuttingPlanSizeBreakdowns_CompanyId",
                table: "CuttingPlanSizeBreakdowns",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingPlanSizeBreakdowns_CuttingPlanId",
                table: "CuttingPlanSizeBreakdowns",
                column: "CuttingPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_CuttingWastages_CompanyId",
                table: "CuttingWastages",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_FabricIssuesToCutting_CompanyId",
                table: "FabricIssuesToCutting",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_FabricIssuesToCutting_CompanyId_IssueNo",
                table: "FabricIssuesToCutting",
                columns: new[] { "CompanyId", "IssueNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FabricIssuesToCutting_CuttingPlanId",
                table: "FabricIssuesToCutting",
                column: "CuttingPlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CuttingAuditLogs");

            migrationBuilder.DropTable(
                name: "CuttingBalances");

            migrationBuilder.DropTable(
                name: "CuttingLaySizeDetails");

            migrationBuilder.DropTable(
                name: "CuttingOutputs");

            migrationBuilder.DropTable(
                name: "CuttingPanelTransferItems");

            migrationBuilder.DropTable(
                name: "CuttingPlanSizeBreakdowns");

            migrationBuilder.DropTable(
                name: "CuttingWastages");

            migrationBuilder.DropTable(
                name: "FabricIssuesToCutting");

            migrationBuilder.DropTable(
                name: "CuttingLays");

            migrationBuilder.DropTable(
                name: "CuttingPanelTransfers");

            migrationBuilder.DropTable(
                name: "CuttingPlans");
        }
    }
}
