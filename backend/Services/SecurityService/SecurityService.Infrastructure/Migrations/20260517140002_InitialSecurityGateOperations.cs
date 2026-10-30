using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecurityService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialSecurityGateOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExternalReferenceSnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReferenceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalReferenceSnapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GateActionLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GateId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReferenceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActionName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ActionAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GateActionLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Gates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GateCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GateName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    LocationName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VehicleNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    VehicleType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DriverName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    DriverPhone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Visitors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisitorName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NIDNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CompanyName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    PhotoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsBlacklisted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Visitors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeOutPasses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PassNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PassDate = table.Column<DateOnly>(type: "date", nullable: false),
                    OutTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpectedReturnTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActualReturnTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ApprovalStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    ApprovedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeOutPasses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeeOutPasses_Gates_GateId",
                        column: x => x.GateId,
                        principalTable: "Gates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GatePasses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GatePassNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    GatePassDate = table.Column<DateOnly>(type: "date", nullable: false),
                    GatePassType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Direction = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ReferenceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SupplierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    BuyerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VehicleNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DriverName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Purpose = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    IsReturnable = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ExpectedReturnDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ApprovalStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    ApprovedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GatePasses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GatePasses_Gates_GateId",
                        column: x => x.GateId,
                        principalTable: "Gates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SecurityCheckLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReferenceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CheckTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CheckedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CheckResult = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityCheckLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SecurityCheckLogs_Gates_GateId",
                        column: x => x.GateId,
                        principalTable: "Gates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VehicleEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntryNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntryDate = table.Column<DateOnly>(type: "date", nullable: false),
                    InTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OutTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Purpose = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    DriverName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    DriverPhone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "In"),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VehicleEntries_Gates_GateId",
                        column: x => x.GateId,
                        principalTable: "Gates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VehicleEntries_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VisitorEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VisitorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntryNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    VisitDate = table.Column<DateOnly>(type: "date", nullable: false),
                    InTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OutTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Purpose = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    PersonToMeetEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VisitorCardNo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "CheckedIn"),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitorEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisitorEntries_Gates_GateId",
                        column: x => x.GateId,
                        principalTable: "Gates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VisitorEntries_Visitors_VisitorId",
                        column: x => x.VisitorId,
                        principalTable: "Visitors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Chalans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChalanNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ChalanDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ChalanType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SupplierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    BuyerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    VehicleNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DriverName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Draft"),
                    GatePassId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chalans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chalans_GatePasses_GatePassId",
                        column: x => x.GatePassId,
                        principalTable: "GatePasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GatePassItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GatePassId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItemName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ItemDescription = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UnitName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ReturnedQty = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false, defaultValue: 0m),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GatePassItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GatePassItems_GatePasses_GatePassId",
                        column: x => x.GatePassId,
                        principalTable: "GatePasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReturnableGatePassReturns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GatePassId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReturnDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ReturnedBy = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    ReceivedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnableGatePassReturns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReturnableGatePassReturns_GatePasses_GatePassId",
                        column: x => x.GatePassId,
                        principalTable: "GatePasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BillEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BillNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BillDate = table.Column<DateOnly>(type: "date", nullable: false),
                    BillType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SupplierId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ChalanId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GatePassId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    VATAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    ApprovedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillEntries_Chalans_ChalanId",
                        column: x => x.ChalanId,
                        principalTable: "Chalans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BillEntries_GatePasses_GatePassId",
                        column: x => x.GatePassId,
                        principalTable: "GatePasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChalanItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChalanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItemName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UnitName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChalanItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChalanItems_Chalans_ChalanId",
                        column: x => x.ChalanId,
                        principalTable: "Chalans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReturnableGatePassReturnItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReturnId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GatePassItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReturnQty = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnableGatePassReturnItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReturnableGatePassReturnItems_GatePassItems_GatePassItemId",
                        column: x => x.GatePassItemId,
                        principalTable: "GatePassItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnableGatePassReturnItems_ReturnableGatePassReturns_ReturnId",
                        column: x => x.ReturnId,
                        principalTable: "ReturnableGatePassReturns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Gates",
                columns: new[] { "Id", "CompanyId", "CreatedAt", "CreatedBy", "GateCode", "GateName", "IsActive", "IsDeleted", "LocationName", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new Guid("31000000-0000-0000-0000-000000000001"), new Guid("20000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "MAIN", "Main Factory Gate", true, false, "Front Security", null, null });

            migrationBuilder.InsertData(
                table: "Vehicles",
                columns: new[] { "Id", "CompanyId", "CreatedAt", "CreatedBy", "DriverName", "DriverPhone", "IsActive", "IsDeleted", "UpdatedAt", "UpdatedBy", "VehicleNo", "VehicleType" },
                values: new object[] { new Guid("31000000-0000-0000-0000-000000000003"), new Guid("20000000-0000-0000-0000-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Sample Driver", "01800000000", true, false, null, null, "DHAKA-METRO-11-0001", "Covered Van" });

            migrationBuilder.InsertData(
                table: "Visitors",
                columns: new[] { "Id", "Address", "CompanyId", "CompanyName", "CreatedAt", "CreatedBy", "IsDeleted", "NIDNo", "Phone", "PhotoUrl", "UpdatedAt", "UpdatedBy", "VisitorName" },
                values: new object[] { new Guid("31000000-0000-0000-0000-000000000002"), null, new Guid("20000000-0000-0000-0000-000000000001"), "Demo Supplier", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, null, "01700000000", null, null, null, "Sample Visitor" });

            migrationBuilder.CreateIndex(
                name: "IX_BillEntries_ChalanId",
                table: "BillEntries",
                column: "ChalanId");

            migrationBuilder.CreateIndex(
                name: "IX_BillEntries_CompanyId",
                table: "BillEntries",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_BillEntries_CompanyId_BillNo",
                table: "BillEntries",
                columns: new[] { "CompanyId", "BillNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BillEntries_GatePassId",
                table: "BillEntries",
                column: "GatePassId");

            migrationBuilder.CreateIndex(
                name: "IX_ChalanItems_ChalanId",
                table: "ChalanItems",
                column: "ChalanId");

            migrationBuilder.CreateIndex(
                name: "IX_ChalanItems_CompanyId",
                table: "ChalanItems",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Chalans_CompanyId",
                table: "Chalans",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Chalans_CompanyId_ChalanNo",
                table: "Chalans",
                columns: new[] { "CompanyId", "ChalanNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Chalans_GatePassId",
                table: "Chalans",
                column: "GatePassId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeOutPasses_CompanyId",
                table: "EmployeeOutPasses",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeOutPasses_CompanyId_PassNo",
                table: "EmployeeOutPasses",
                columns: new[] { "CompanyId", "PassNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeOutPasses_GateId",
                table: "EmployeeOutPasses",
                column: "GateId");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalReferenceSnapshots_CompanyId",
                table: "ExternalReferenceSnapshots",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalReferenceSnapshots_CompanyId_ReferenceType_ReferenceId",
                table: "ExternalReferenceSnapshots",
                columns: new[] { "CompanyId", "ReferenceType", "ReferenceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GateActionLogs_CompanyId_ReferenceType_ReferenceId_ActionAt",
                table: "GateActionLogs",
                columns: new[] { "CompanyId", "ReferenceType", "ReferenceId", "ActionAt" });

            migrationBuilder.CreateIndex(
                name: "IX_GatePasses_CompanyId",
                table: "GatePasses",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_GatePasses_CompanyId_GatePassNo",
                table: "GatePasses",
                columns: new[] { "CompanyId", "GatePassNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GatePasses_GateId",
                table: "GatePasses",
                column: "GateId");

            migrationBuilder.CreateIndex(
                name: "IX_GatePassItems_CompanyId",
                table: "GatePassItems",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_GatePassItems_GatePassId",
                table: "GatePassItems",
                column: "GatePassId");

            migrationBuilder.CreateIndex(
                name: "IX_Gates_CompanyId",
                table: "Gates",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Gates_CompanyId_GateCode",
                table: "Gates",
                columns: new[] { "CompanyId", "GateCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReturnableGatePassReturnItems_CompanyId",
                table: "ReturnableGatePassReturnItems",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnableGatePassReturnItems_GatePassItemId",
                table: "ReturnableGatePassReturnItems",
                column: "GatePassItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnableGatePassReturnItems_ReturnId",
                table: "ReturnableGatePassReturnItems",
                column: "ReturnId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnableGatePassReturns_CompanyId",
                table: "ReturnableGatePassReturns",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnableGatePassReturns_GatePassId",
                table: "ReturnableGatePassReturns",
                column: "GatePassId");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityCheckLogs_CompanyId",
                table: "SecurityCheckLogs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityCheckLogs_CompanyId_ReferenceType_ReferenceId",
                table: "SecurityCheckLogs",
                columns: new[] { "CompanyId", "ReferenceType", "ReferenceId" });

            migrationBuilder.CreateIndex(
                name: "IX_SecurityCheckLogs_GateId",
                table: "SecurityCheckLogs",
                column: "GateId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleEntries_CompanyId",
                table: "VehicleEntries",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleEntries_CompanyId_EntryNo",
                table: "VehicleEntries",
                columns: new[] { "CompanyId", "EntryNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleEntries_GateId",
                table: "VehicleEntries",
                column: "GateId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleEntries_VehicleId",
                table: "VehicleEntries",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_CompanyId",
                table: "Vehicles",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_CompanyId_VehicleNo",
                table: "Vehicles",
                columns: new[] { "CompanyId", "VehicleNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VisitorEntries_CompanyId",
                table: "VisitorEntries",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorEntries_CompanyId_EntryNo",
                table: "VisitorEntries",
                columns: new[] { "CompanyId", "EntryNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VisitorEntries_GateId",
                table: "VisitorEntries",
                column: "GateId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitorEntries_VisitorId",
                table: "VisitorEntries",
                column: "VisitorId");

            migrationBuilder.CreateIndex(
                name: "IX_Visitors_CompanyId",
                table: "Visitors",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Visitors_CompanyId_Phone",
                table: "Visitors",
                columns: new[] { "CompanyId", "Phone" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillEntries");

            migrationBuilder.DropTable(
                name: "ChalanItems");

            migrationBuilder.DropTable(
                name: "EmployeeOutPasses");

            migrationBuilder.DropTable(
                name: "ExternalReferenceSnapshots");

            migrationBuilder.DropTable(
                name: "GateActionLogs");

            migrationBuilder.DropTable(
                name: "ReturnableGatePassReturnItems");

            migrationBuilder.DropTable(
                name: "SecurityCheckLogs");

            migrationBuilder.DropTable(
                name: "VehicleEntries");

            migrationBuilder.DropTable(
                name: "VisitorEntries");

            migrationBuilder.DropTable(
                name: "Chalans");

            migrationBuilder.DropTable(
                name: "GatePassItems");

            migrationBuilder.DropTable(
                name: "ReturnableGatePassReturns");

            migrationBuilder.DropTable(
                name: "Vehicles");

            migrationBuilder.DropTable(
                name: "Visitors");

            migrationBuilder.DropTable(
                name: "GatePasses");

            migrationBuilder.DropTable(
                name: "Gates");
        }
    }
}
