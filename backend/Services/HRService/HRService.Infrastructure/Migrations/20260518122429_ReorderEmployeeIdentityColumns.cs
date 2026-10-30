using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReorderEmployeeIdentityColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.Employees', 'PunchNumber') IS NULL
                    RETURN;

                IF (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Employees') AND name = 'PunchNumber') = 2
                    RETURN;

                DECLARE @fk nvarchar(max) = N'';
                SELECT @fk = @fk + N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + N'.' + QUOTENAME(OBJECT_NAME(parent_object_id))
                    + N' DROP CONSTRAINT ' + QUOTENAME(name) + N';' + CHAR(10)
                FROM sys.foreign_keys
                WHERE referenced_object_id = OBJECT_ID('dbo.Employees');
                EXEC sp_executesql @fk;

                CREATE TABLE dbo.Employees_new (
                    Id uniqueidentifier NOT NULL,
                    PunchNumber int NOT NULL,
                    EmployeeID nvarchar(32) NOT NULL,
                    CompanyId uniqueidentifier NOT NULL,
                    FullName nvarchar(150) NOT NULL,
                    BanglaName nvarchar(150) NULL,
                    Gender nvarchar(20) NULL,
                    DateOfBirth datetime2 NULL,
                    NationalId nvarchar(50) NULL,
                    BirthCertificateNo nvarchar(50) NULL,
                    Phone nvarchar(50) NULL,
                    Email nvarchar(150) NULL,
                    JoinDate datetime2 NOT NULL,
                    EmploymentType nvarchar(50) NOT NULL,
                    Status nvarchar(50) NOT NULL,
                    CreatedAt datetime2 NOT NULL,
                    UpdatedAt datetime2 NULL,
                    IsDeleted bit NOT NULL,
                    DeletedAt datetimeoffset NULL,
                    CONSTRAINT PK_Employees_reorder PRIMARY KEY (Id)
                );

                INSERT INTO dbo.Employees_new (
                    Id, PunchNumber, EmployeeID, CompanyId, FullName, BanglaName, Gender, DateOfBirth,
                    NationalId, BirthCertificateNo, Phone, Email, JoinDate, EmploymentType, Status,
                    CreatedAt, UpdatedAt, IsDeleted, DeletedAt)
                SELECT
                    Id, PunchNumber, EmployeeID, CompanyId, FullName, BanglaName, Gender, DateOfBirth,
                    NationalId, BirthCertificateNo, Phone, Email, JoinDate, EmploymentType, Status,
                    CreatedAt, UpdatedAt, IsDeleted, DeletedAt
                FROM dbo.Employees;

                DROP TABLE dbo.Employees;
                EXEC sp_rename N'dbo.Employees_new', N'Employees', N'OBJECT';
                EXEC sp_rename N'dbo.PK_Employees_reorder', N'PK_Employees', N'OBJECT';

                CREATE UNIQUE INDEX IX_Employees_CompanyId_EmployeeID ON dbo.Employees (CompanyId, EmployeeID) WHERE [IsDeleted] = 0;
                CREATE UNIQUE INDEX IX_Employees_CompanyId_PunchNumber ON dbo.Employees (CompanyId, PunchNumber) WHERE [IsDeleted] = 0;

                ALTER TABLE dbo.EmployeeAddresses ADD CONSTRAINT FK_EmployeeAddresses_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeBankAccounts ADD CONSTRAINT FK_EmployeeBankAccounts_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeDocuments ADD CONSTRAINT FK_EmployeeDocuments_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeEmergencyContacts ADD CONSTRAINT FK_EmployeeEmergencyContacts_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeSalaryInfos ADD CONSTRAINT FK_EmployeeSalaryInfos_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeStatusHistories ADD CONSTRAINT FK_EmployeeStatusHistories_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeTransfers ADD CONSTRAINT FK_EmployeeTransfers_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeJobInfos ADD CONSTRAINT FK_EmployeeJobInfos_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.Employees', 'PunchNumber') IS NULL
                    RETURN;

                IF (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Employees') AND name = 'PunchNumber')
                    > (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Employees') AND name = 'CompanyId')
                    RETURN;

                DECLARE @fk nvarchar(max) = N'';
                SELECT @fk = @fk + N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + N'.' + QUOTENAME(OBJECT_NAME(parent_object_id))
                    + N' DROP CONSTRAINT ' + QUOTENAME(name) + N';' + CHAR(10)
                FROM sys.foreign_keys
                WHERE referenced_object_id = OBJECT_ID('dbo.Employees');
                EXEC sp_executesql @fk;

                CREATE TABLE dbo.Employees_new (
                    Id uniqueidentifier NOT NULL,
                    CompanyId uniqueidentifier NOT NULL,
                    FullName nvarchar(150) NOT NULL,
                    BanglaName nvarchar(150) NULL,
                    Gender nvarchar(20) NULL,
                    DateOfBirth datetime2 NULL,
                    NationalId nvarchar(50) NULL,
                    BirthCertificateNo nvarchar(50) NULL,
                    Phone nvarchar(50) NULL,
                    Email nvarchar(150) NULL,
                    JoinDate datetime2 NOT NULL,
                    EmploymentType nvarchar(50) NOT NULL,
                    Status nvarchar(50) NOT NULL,
                    CreatedAt datetime2 NOT NULL,
                    UpdatedAt datetime2 NULL,
                    IsDeleted bit NOT NULL,
                    DeletedAt datetimeoffset NULL,
                    EmployeeID nvarchar(32) NOT NULL,
                    PunchNumber int NOT NULL,
                    CONSTRAINT PK_Employees_reorder PRIMARY KEY (Id)
                );

                INSERT INTO dbo.Employees_new (
                    Id, CompanyId, FullName, BanglaName, Gender, DateOfBirth,
                    NationalId, BirthCertificateNo, Phone, Email, JoinDate, EmploymentType, Status,
                    CreatedAt, UpdatedAt, IsDeleted, DeletedAt, EmployeeID, PunchNumber)
                SELECT
                    Id, CompanyId, FullName, BanglaName, Gender, DateOfBirth,
                    NationalId, BirthCertificateNo, Phone, Email, JoinDate, EmploymentType, Status,
                    CreatedAt, UpdatedAt, IsDeleted, DeletedAt, EmployeeID, PunchNumber
                FROM dbo.Employees;

                DROP TABLE dbo.Employees;
                EXEC sp_rename N'dbo.Employees_new', N'Employees', N'OBJECT';
                EXEC sp_rename N'dbo.PK_Employees_reorder', N'PK_Employees', N'OBJECT';

                CREATE UNIQUE INDEX IX_Employees_CompanyId_EmployeeID ON dbo.Employees (CompanyId, EmployeeID) WHERE [IsDeleted] = 0;
                CREATE UNIQUE INDEX IX_Employees_CompanyId_PunchNumber ON dbo.Employees (CompanyId, PunchNumber) WHERE [IsDeleted] = 0;

                ALTER TABLE dbo.EmployeeAddresses ADD CONSTRAINT FK_EmployeeAddresses_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeBankAccounts ADD CONSTRAINT FK_EmployeeBankAccounts_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeDocuments ADD CONSTRAINT FK_EmployeeDocuments_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeEmergencyContacts ADD CONSTRAINT FK_EmployeeEmergencyContacts_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeSalaryInfos ADD CONSTRAINT FK_EmployeeSalaryInfos_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeStatusHistories ADD CONSTRAINT FK_EmployeeStatusHistories_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeTransfers ADD CONSTRAINT FK_EmployeeTransfers_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                ALTER TABLE dbo.EmployeeJobInfos ADD CONSTRAINT FK_EmployeeJobInfos_Employees_EmployeeId
                    FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees (Id) ON DELETE CASCADE;
                """);
        }
    }
}
