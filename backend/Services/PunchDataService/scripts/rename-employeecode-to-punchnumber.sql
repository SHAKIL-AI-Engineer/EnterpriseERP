-- Rename PunchRecords.EmployeeCode (string) to PunchNumber (int).
USE PunchDataDB;
GO

IF COL_LENGTH('dbo.PunchRecords', 'PunchNumber') IS NULL
BEGIN
    ALTER TABLE dbo.PunchRecords ADD PunchNumber int NULL;
END
GO

UPDATE dbo.PunchRecords
SET PunchNumber = TRY_CAST(EmployeeCode AS int)
WHERE PunchNumber IS NULL AND TRY_CAST(EmployeeCode AS int) IS NOT NULL AND TRY_CAST(EmployeeCode AS int) > 0;
GO

-- Drop indexes that reference EmployeeCode
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_punch_dedupe' AND object_id = OBJECT_ID('dbo.PunchRecords'))
    DROP INDEX ux_punch_dedupe ON dbo.PunchRecords;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_punch_emp_time' AND object_id = OBJECT_ID('dbo.PunchRecords'))
    DROP INDEX idx_punch_emp_time ON dbo.PunchRecords;
GO

IF COL_LENGTH('dbo.PunchRecords', 'EmployeeCode') IS NOT NULL
BEGIN
    ALTER TABLE dbo.PunchRecords DROP COLUMN EmployeeCode;
END
GO

DELETE FROM dbo.PunchRecords WHERE PunchNumber IS NULL OR PunchNumber <= 0;
GO

ALTER TABLE dbo.PunchRecords ALTER COLUMN PunchNumber int NOT NULL;
GO

CREATE UNIQUE INDEX ux_punch_dedupe ON dbo.PunchRecords (CompanyId, PunchNumber, DeviceId, PunchTime);
GO
