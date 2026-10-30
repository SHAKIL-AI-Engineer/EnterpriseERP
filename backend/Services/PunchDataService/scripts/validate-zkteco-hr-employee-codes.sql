-- Validate ZKTeco USERINFO.BADGENUMBER against ERP HR Employees.PunchNumber.
-- Rule: Employees.PunchNumber must equal TRY_CAST(USERINFO.BADGENUMBER AS int) where badge is numeric.
--
-- Set database names for your environment:
--   zkteco      = remote ZKTeco SQL (USERINFO)
--   HRServiceDB = ERP HR master (Employees)

USE HRServiceDB;
GO

DECLARE @ErpCompanyId uniqueidentifier = 'BCC18DE7-7D50-43BD-96DA-6E3E8DEC3825'; -- ERP company GUID

-- ZKTeco users with no matching HR punch number (fix HR.PunchNumber or badge on device)
SELECT
    u.USERID,
    u.BADGENUMBER,
    u.NAME
FROM zkteco.dbo.USERINFO u
WHERE TRY_CAST(LTRIM(RTRIM(CAST(u.BADGENUMBER AS nvarchar(50)))) AS int) IS NOT NULL
  AND TRY_CAST(LTRIM(RTRIM(CAST(u.BADGENUMBER AS nvarchar(50)))) AS int) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM dbo.Employees e
    WHERE e.CompanyId = @ErpCompanyId
      AND e.IsDeleted = 0
      AND e.PunchNumber = TRY_CAST(LTRIM(RTRIM(CAST(u.BADGENUMBER AS nvarchar(50)))) AS int)
  )
ORDER BY u.BADGENUMBER;

-- HR employees missing EmployeeID or invalid PunchNumber
SELECT
    e.Id,
    e.PunchNumber,
    e.EmployeeID,
    e.FullName
FROM dbo.Employees e
WHERE e.CompanyId = @ErpCompanyId
  AND e.IsDeleted = 0
  AND (
    e.PunchNumber IS NULL OR e.PunchNumber <= 0
    OR e.EmployeeID IS NULL OR LTRIM(RTRIM(e.EmployeeID)) = ''
  )
ORDER BY e.PunchNumber;

-- HR punch numbers with no ZKTeco badge (optional — may be office-only staff)
SELECT
    e.PunchNumber,
    e.EmployeeID,
    e.FullName
FROM dbo.Employees e
WHERE e.CompanyId = @ErpCompanyId
  AND e.IsDeleted = 0
  AND e.PunchNumber > 0
  AND NOT EXISTS (
    SELECT 1
    FROM zkteco.dbo.USERINFO u
    WHERE TRY_CAST(LTRIM(RTRIM(CAST(u.BADGENUMBER AS nvarchar(50)))) AS int) = e.PunchNumber
  )
ORDER BY e.PunchNumber;
