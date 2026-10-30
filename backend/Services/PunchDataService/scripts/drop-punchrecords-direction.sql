-- Remove Direction column from PunchRecords (attendance infers in/out from punch times).
USE PunchDataDB;
GO

IF COL_LENGTH('dbo.PunchRecords', 'Direction') IS NOT NULL
BEGIN
    ALTER TABLE dbo.PunchRecords DROP COLUMN Direction;
END
GO
