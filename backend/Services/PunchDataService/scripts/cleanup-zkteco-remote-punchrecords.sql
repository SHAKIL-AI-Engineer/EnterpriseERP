-- Remove PunchRecords imported before BADGENUMBER mapping (EmployeeCode stored as USERID).
-- Run on PunchDataDB, then re-run POST /api/v1/punch-data/remote/collect.
--
-- Review counts before DELETE:
SELECT Source, COUNT(*) AS Cnt
FROM dbo.PunchRecords
GROUP BY Source;

-- Delete remote-import punches only (keeps device sync / manual / CSV rows)
DELETE FROM dbo.PunchRecords
WHERE Source = N'ZKTecoRemote';

-- Optional: remove orphaned log files from remote collect
DELETE FROM dbo.PunchLogFiles
WHERE SourceType = N'RemoteZktecoCollect';

-- Reset collect watermark history if you need a full re-import window
-- DELETE FROM dbo.RemoteCollectHistories WHERE CompanyId = 1;
