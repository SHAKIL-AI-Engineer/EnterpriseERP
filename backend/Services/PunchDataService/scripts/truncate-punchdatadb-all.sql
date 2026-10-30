-- Clears all PunchDataDB application data (schema preserved).
-- Does NOT touch Auth, Attendance, HR, or other ERP databases.
USE [PunchDataDB];
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.PunchImportErrors', N'U') IS NOT NULL DELETE FROM [dbo].[PunchImportErrors];
IF OBJECT_ID(N'dbo.PunchRecords', N'U') IS NOT NULL DELETE FROM [dbo].[PunchRecords];
IF OBJECT_ID(N'dbo.RemoteCollectHistories', N'U') IS NOT NULL DELETE FROM [dbo].[RemoteCollectHistories];
IF OBJECT_ID(N'dbo.DeviceSyncHistories', N'U') IS NOT NULL DELETE FROM [dbo].[DeviceSyncHistories];
IF OBJECT_ID(N'dbo.PunchLogFiles', N'U') IS NOT NULL DELETE FROM [dbo].[PunchLogFiles];
IF OBJECT_ID(N'dbo.PunchImportBatches', N'U') IS NOT NULL DELETE FROM [dbo].[PunchImportBatches];
IF OBJECT_ID(N'dbo.PunchMachines', N'U') IS NOT NULL DELETE FROM [dbo].[PunchMachines];

COMMIT TRANSACTION;

SELECT 'PunchDataDB data cleared' AS Result;
GO
