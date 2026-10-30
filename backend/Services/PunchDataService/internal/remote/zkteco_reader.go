package remote

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
	"github.com/google/uuid"
)

// RemotePunch is one row from zkteco CHECKINOUT joined to USERINFO (read-only).
type RemotePunch struct {
	UserID      int
	BadgeNumber string
	CheckTime   time.Time
	CheckType   string
	SensorID    string
	SerialNo    string
}

// ToPunchRecordsResult holds converted punch rows and rows skipped due to invalid badge.
type ToPunchRecordsResult struct {
	Records []models.PunchRecord
	Skipped int
}

// Reader executes read-only SELECT queries against the public ZKTeco database.
type Reader struct {
	db *sql.DB
}

func NewReader(db *sql.DB) *Reader { return &Reader{db: db} }

func (r *Reader) Ping(ctx context.Context) error {
	return r.db.PingContext(ctx)
}

const checkInOutJoinFrom = `
FROM dbo.CHECKINOUT c WITH (NOLOCK, READUNCOMMITTED)
INNER JOIN dbo.USERINFO u WITH (NOLOCK, READUNCOMMITTED)
  ON u.USERID = c.USERID`

// FetchCHECKINOUT loads punch rows in a time window using SELECT only.
// Punch identity comes from USERINFO.BADGENUMBER (numeric), not CHECKINOUT.USERID.
func (r *Reader) FetchCHECKINOUT(ctx context.Context, from, to time.Time, limit int) ([]RemotePunch, error) {
	if limit <= 0 {
		limit = 500
	}
	if limit > 2000 {
		limit = 2000
	}
	q := fmt.Sprintf(`
SELECT TOP (%d)
  c.USERID,
  LTRIM(RTRIM(CAST(u.BADGENUMBER AS nvarchar(64)))),
  c.CHECKTIME,
  c.CHECKTYPE,
  ISNULL(c.SENSORID, ''),
  ISNULL(c.sn, '')
%s
WHERE c.CHECKTIME > @p1 AND c.CHECKTIME <= @p2
ORDER BY c.CHECKTIME ASC`, limit, checkInOutJoinFrom)

	rows, err := r.db.QueryContext(ctx, q, from, to)
	if err != nil {
		return nil, fmt.Errorf("read CHECKINOUT: %w", err)
	}
	defer rows.Close()

	out := make([]RemotePunch, 0, 256)
	for rows.Next() {
		var p RemotePunch
		if err := rows.Scan(&p.UserID, &p.BadgeNumber, &p.CheckTime, &p.CheckType, &p.SensorID, &p.SerialNo); err != nil {
			return nil, err
		}
		p.BadgeNumber = strings.TrimSpace(p.BadgeNumber)
		out = append(out, p)
	}
	return out, rows.Err()
}

// CountCHECKINOUT returns how many punch rows exist in the window with a resolvable USERINFO badge join.
func (r *Reader) CountCHECKINOUT(ctx context.Context, from, to time.Time) (int64, error) {
	const q = `
SELECT COUNT(1)
` + checkInOutJoinFrom + `
WHERE c.CHECKTIME > @p1 AND c.CHECKTIME <= @p2`
	var n int64
	err := r.db.QueryRowContext(ctx, q, from, to).Scan(&n)
	return n, err
}

// CountUnmappedCHECKINOUT returns punches in the window with no USERINFO row or empty BADGENUMBER.
func (r *Reader) CountUnmappedCHECKINOUT(ctx context.Context, from, to time.Time) (int64, error) {
	const q = `
SELECT COUNT(1)
FROM dbo.CHECKINOUT c WITH (NOLOCK, READUNCOMMITTED)
LEFT JOIN dbo.USERINFO u WITH (NOLOCK, READUNCOMMITTED)
  ON u.USERID = c.USERID
WHERE c.CHECKTIME > @p1 AND c.CHECKTIME <= @p2
  AND (
    u.USERID IS NULL
    OR LTRIM(RTRIM(CAST(u.BADGENUMBER AS nvarchar(64)))) = ''
  )`
	var n int64
	err := r.db.QueryRowContext(ctx, q, from, to).Scan(&n)
	return n, err
}

// ToPunchRecords converts remote rows into local PunchRecord entities.
// PunchNumber is parsed from USERINFO.BADGENUMBER (matches HR PunchNumber).
func ToPunchRecords(logFileID uuid.UUID, companyID int, source string, rows []RemotePunch) ToPunchRecordsResult {
	out := ToPunchRecordsResult{
		Records: make([]models.PunchRecord, 0, len(rows)),
	}
	now := timeutil.Now()
	for _, row := range rows {
		punchNumber, err := models.ParsePunchNumber(row.BadgeNumber)
		if err != nil {
			out.Skipped++
			continue
		}
		device := strings.TrimSpace(row.SensorID)
		if device == "" {
			device = strings.TrimSpace(row.SerialNo)
		}
		out.Records = append(out.Records, models.PunchRecord{
			ID:          uuid.New(),
			LogFileID:   logFileID,
			CompanyID:   companyID,
			PunchNumber: punchNumber,
			DeviceID:    device,
			PunchTime:   timeutil.WallClock(row.CheckTime),
			Source:      source,
			CreatedAt:   now,
		})
	}
	return out
}
