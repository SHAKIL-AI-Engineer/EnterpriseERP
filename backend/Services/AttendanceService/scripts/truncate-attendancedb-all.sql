-- Clears all AttendanceServiceDB application data (schema preserved).
-- Does NOT touch PunchDataDB, HR, Shift, or other ERP databases.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE [AttendanceServiceDB];
GO

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.AttendanceProcessErrors', N'U') IS NOT NULL DELETE FROM [dbo].[AttendanceProcessErrors];
IF OBJECT_ID(N'dbo.AttendanceProcessBatches', N'U') IS NOT NULL DELETE FROM [dbo].[AttendanceProcessBatches];
IF OBJECT_ID(N'dbo.DailyAttendances', N'U') IS NOT NULL DELETE FROM [dbo].[DailyAttendances];
IF OBJECT_ID(N'dbo.DeviceLogs', N'U') IS NOT NULL DELETE FROM [dbo].[DeviceLogs];
-- Legacy table from early migrations (remove if present)
IF OBJECT_ID(N'dbo.AttendanceRecords', N'U') IS NOT NULL DELETE FROM [dbo].[AttendanceRecords];

COMMIT TRANSACTION;

SELECT 'AttendanceServiceDB data cleared' AS Result;
GO
