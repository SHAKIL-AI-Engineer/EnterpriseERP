using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CompanyService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOrganogramCodeColumnsSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Companies_CompanyCode' AND object_id = OBJECT_ID('Companies'))
                    DROP INDEX [IX_Companies_CompanyCode] ON [Companies];

                IF COL_LENGTH('Companies', 'CompanyCode') IS NOT NULL
                    ALTER TABLE [Companies] DROP COLUMN [CompanyCode];

                IF COL_LENGTH('Departments', 'Code') IS NOT NULL
                    ALTER TABLE [Departments] DROP COLUMN [Code];

                IF COL_LENGTH('Sections', 'Code') IS NOT NULL
                    ALTER TABLE [Sections] DROP COLUMN [Code];

                IF COL_LENGTH('Designations', 'Code') IS NOT NULL
                    ALTER TABLE [Designations] DROP COLUMN [Code];

                IF COL_LENGTH('Lines', 'Code') IS NOT NULL
                    ALTER TABLE [Lines] DROP COLUMN [Code];

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Companies_CompanyNameEn' AND object_id = OBJECT_ID('Companies'))
                    CREATE UNIQUE INDEX [IX_Companies_CompanyNameEn] ON [Companies]([CompanyNameEn]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Departments_CompanyId_NameEn' AND object_id = OBJECT_ID('Departments'))
                    CREATE UNIQUE INDEX [IX_Departments_CompanyId_NameEn] ON [Departments]([CompanyId], [NameEn]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Sections_DepartmentId_NameEn' AND object_id = OBJECT_ID('Sections'))
                    CREATE UNIQUE INDEX [IX_Sections_DepartmentId_NameEn] ON [Sections]([DepartmentId], [NameEn]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Designations_SectionId_NameEn' AND object_id = OBJECT_ID('Designations'))
                    CREATE UNIQUE INDEX [IX_Designations_SectionId_NameEn] ON [Designations]([SectionId], [NameEn]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Lines_SectionId_NameEn' AND object_id = OBJECT_ID('Lines'))
                    CREATE UNIQUE INDEX [IX_Lines_SectionId_NameEn] ON [Lines]([SectionId], [NameEn]);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Lines_SectionId_NameEn' AND object_id = OBJECT_ID('Lines'))
                    DROP INDEX [IX_Lines_SectionId_NameEn] ON [Lines];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Designations_SectionId_NameEn' AND object_id = OBJECT_ID('Designations'))
                    DROP INDEX [IX_Designations_SectionId_NameEn] ON [Designations];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Sections_DepartmentId_NameEn' AND object_id = OBJECT_ID('Sections'))
                    DROP INDEX [IX_Sections_DepartmentId_NameEn] ON [Sections];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Departments_CompanyId_NameEn' AND object_id = OBJECT_ID('Departments'))
                    DROP INDEX [IX_Departments_CompanyId_NameEn] ON [Departments];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Companies_CompanyNameEn' AND object_id = OBJECT_ID('Companies'))
                    DROP INDEX [IX_Companies_CompanyNameEn] ON [Companies];

                IF COL_LENGTH('Companies', 'CompanyCode') IS NULL
                    ALTER TABLE [Companies] ADD [CompanyCode] nvarchar(50) NOT NULL CONSTRAINT DF_Companies_CompanyCode DEFAULT '';
                IF COL_LENGTH('Departments', 'Code') IS NULL
                    ALTER TABLE [Departments] ADD [Code] nvarchar(max) NULL;
                IF COL_LENGTH('Sections', 'Code') IS NULL
                    ALTER TABLE [Sections] ADD [Code] nvarchar(max) NULL;
                IF COL_LENGTH('Designations', 'Code') IS NULL
                    ALTER TABLE [Designations] ADD [Code] nvarchar(max) NULL;
                IF COL_LENGTH('Lines', 'Code') IS NULL
                    ALTER TABLE [Lines] ADD [Code] nvarchar(max) NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Companies_CompanyCode' AND object_id = OBJECT_ID('Companies'))
                    CREATE UNIQUE INDEX [IX_Companies_CompanyCode] ON [Companies]([CompanyCode]);
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Departments_CompanyId' AND object_id = OBJECT_ID('Departments'))
                    CREATE INDEX [IX_Departments_CompanyId] ON [Departments]([CompanyId]);
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Sections_DepartmentId' AND object_id = OBJECT_ID('Sections'))
                    CREATE INDEX [IX_Sections_DepartmentId] ON [Sections]([DepartmentId]);
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Designations_SectionId' AND object_id = OBJECT_ID('Designations'))
                    CREATE INDEX [IX_Designations_SectionId] ON [Designations]([SectionId]);
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Lines_SectionId' AND object_id = OBJECT_ID('Lines'))
                    CREATE INDEX [IX_Lines_SectionId] ON [Lines]([SectionId]);
                """);
        }
    }
}
