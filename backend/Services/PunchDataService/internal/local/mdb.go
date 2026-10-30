package local

import (
	"context"
	"fmt"
	"log/slog"
	"runtime"
	"strconv"
	"strings"
	"time"

	ole "github.com/go-ole/go-ole"
	"github.com/go-ole/go-ole/oleutil"

	"github.com/enterprise-erp/punchdata/internal/remote"
)

const accessDriver = "Microsoft Access Driver (*.mdb, *.accdb)"

// ConnectionString assembles an ADODB connection string for the local ZKTeco
// Access MDB file. MSDASQL routes to the 64-bit Access ODBC driver; the file is
// opened read-only so the live ZKTeco software can keep writing to it.
func ConnectionString(mdbPath string) string {
	return fmt.Sprintf("Provider=MSDASQL;Driver={%s};DBQ=%s;ReadOnly=1;", accessDriver, mdbPath)
}

// Session is a read-only COM session against a local ZKTeco Access MDB.
//
// COM apartment state is per OS thread, so a Session pins the opening goroutine
// to one thread for its lifetime. All queries must be issued from that same
// goroutine; Close releases the thread back to the runtime pool.
type Session struct {
	path   string
	logger *slog.Logger
	conn   *ole.IDispatch
}

// OpenSession opens the MDB file. Call Close when the caller is done.
func OpenSession(mdbPath string, logger *slog.Logger) (*Session, error) {
	trimmed := strings.TrimSpace(mdbPath)
	if trimmed == "" {
		return nil, fmt.Errorf("local ZKTeco MDB path is empty")
	}
	runtime.LockOSThread()
	if err := ole.CoInitializeEx(0, ole.COINIT_MULTITHREADED); err != nil {
		runtime.UnlockOSThread()
		return nil, fmt.Errorf("initialize COM: %w", err)
	}
	unknown, err := oleutil.CreateObject("ADODB.Connection")
	if err != nil {
		ole.CoUninitialize()
		runtime.UnlockOSThread()
		return nil, fmt.Errorf("create ADODB.Connection: %w", err)
	}
	conn, err := unknown.QueryInterface(ole.IID_IDispatch)
	unknown.Release()
	if err != nil {
		ole.CoUninitialize()
		runtime.UnlockOSThread()
		return nil, fmt.Errorf("query ADODB.Connection dispatch: %w", err)
	}
	s := &Session{path: trimmed, logger: logger, conn: conn}
	if err := s.open(); err != nil {
		s.closeCom()
		return nil, err
	}
	return s, nil
}

func (s *Session) open() error {
	if _, err := oleutil.PutProperty(s.conn, "ConnectionString", ConnectionString(s.path)); err != nil {
		return fmt.Errorf("set ADODB connection string: %w", err)
	}
	if _, err := oleutil.CallMethod(s.conn, "Open"); err != nil {
		return fmt.Errorf("open access mdb %q: %w", s.path, err)
	}
	if s.logger != nil {
		s.logger.Info("local ZKTeco MDB opened (read-only)", "path", s.path)
	}
	return nil
}

// Close releases the ADODB connection, COM apartment, and pinned OS thread.
func (s *Session) Close() {
	s.closeCom()
}

func (s *Session) closeCom() {
	if s.conn != nil {
		_, _ = oleutil.CallMethod(s.conn, "Close")
		s.conn.Release()
		s.conn = nil
	}
	ole.CoUninitialize()
	runtime.UnlockOSThread()
}

// Ping confirms the MDB is reachable with a cheap scalar query.
func (s *Session) Ping(ctx context.Context) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	_, err := s.countScalar("SELECT COUNT(1) FROM CHECKINOUT")
	return err
}

// FetchCheckinOut loads punch rows in a time window (SELECT only), joined to
// USERINFO for the punch badge. Punch identity comes from USERINFO.BADGENUMBER.
// The lower bound is inclusive so row groups sharing a timestamp at a page
// boundary are re-fetched (and deduplicated downstream) instead of skipped.
func (s *Session) FetchCheckinOut(ctx context.Context, from, to time.Time, limit int) ([]remote.RemotePunch, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = 500
	}
	if limit > 2000 {
		limit = 2000
	}
	q := fmt.Sprintf(`
SELECT TOP %d
  c.USERID,
  u.BADGENUMBER,
  c.CHECKTIME,
  c.CHECKTYPE,
  c.SENSORID,
  c.sn
FROM CHECKINOUT AS c
INNER JOIN USERINFO AS u ON c.USERID = u.USERID
WHERE c.CHECKTIME >= %s AND c.CHECKTIME <= %s
ORDER BY c.CHECKTIME ASC`, limit, accessDateLiteral(from), accessDateLiteral(to))

	rs, err := s.execute(q)
	if err != nil {
		return nil, err
	}
	defer insistRelease(rs)

	out := make([]remote.RemotePunch, 0, 256)
	for {
		eof, err := eofState(rs)
		if err != nil {
			return nil, err
		}
		if eof {
			break
		}
		vals, err := rowValues(rs, 6)
		if err != nil {
			return nil, err
		}
		p := remote.RemotePunch{
			UserID:      int(toInt64OrDefault(vals[0])),
			BadgeNumber: strings.TrimSpace(toString(vals[1])),
			CheckTime:   toTime(vals[2]),
			CheckType:   toString(vals[3]),
			SensorID:    toString(vals[4]),
			SerialNo:    toString(vals[5]),
		}
		out = append(out, p)
		if _, err := oleutil.CallMethod(rs, "MoveNext"); err != nil {
			return nil, fmt.Errorf("ADODB MoveNext: %w", err)
		}
	}
	return out, nil
}

// CountCheckinOut returns how many punch rows exist in the window with a
// resolvable USERINFO badge join.
func (s *Session) CountCheckinOut(ctx context.Context, from, to time.Time) (int64, error) {
	if err := ctx.Err(); err != nil {
		return 0, err
	}
	q := fmt.Sprintf(`
SELECT COUNT(1)
FROM CHECKINOUT AS c
INNER JOIN USERINFO AS u ON c.USERID = u.USERID
WHERE c.CHECKTIME >= %s AND c.CHECKTIME <= %s`, accessDateLiteral(from), accessDateLiteral(to))
	return s.countScalar(q)
}

// CountUnmappedCheckinOut returns punches in the window with no USERINFO row or
// an empty BADGENUMBER.
func (s *Session) CountUnmappedCheckinOut(ctx context.Context, from, to time.Time) (int64, error) {
	if err := ctx.Err(); err != nil {
		return 0, err
	}
	q := fmt.Sprintf(`
SELECT COUNT(1)
FROM CHECKINOUT AS c
LEFT JOIN USERINFO AS u ON c.USERID = u.USERID
WHERE c.CHECKTIME >= %s AND c.CHECKTIME <= %s
  AND (u.USERID IS NULL OR LEN(TRIM(u.BADGENUMBER)) = 0)`, accessDateLiteral(from), accessDateLiteral(to))
	return s.countScalar(q)
}

// accessDateLiteral formats a wall-clock time for an Access date literal. The
// MDB stores local wall-clock punches, and every time used here (parsed from/to
// bounds and ADODB result values) is already a wall-clock value labeled UTC, so
// we render it as UTC instead of re-converting through time.Local, which would
// shift the bound by the zone offset and skip rows between pages.
func accessDateLiteral(t time.Time) string {
	w := t.UTC()
	return "#" + w.Format("2006-01-02 15:04:05") + "#"
}

// execute runs a query on the opened connection and returns the Recordset
// dispatch, AddRef'd so the caller owns a stable reference.
func (s *Session) execute(query string) (*ole.IDispatch, error) {
	res, err := oleutil.CallMethod(s.conn, "Execute", query)
	if err != nil {
		return nil, fmt.Errorf("ADODB execute failed: %w", err)
	}
	di := res.ToIDispatch()
	di.AddRef()
	res.Clear()
	return di, nil
}

func (s *Session) countScalar(query string) (int64, error) {
	rs, err := s.execute(query)
	if err != nil {
		return 0, err
	}
	defer insistRelease(rs)
	return scalarInt(rs, 0)
}

func scalarInt(rs *ole.IDispatch, index int) (int64, error) {
	fv, err := oleutil.GetProperty(rs, "Fields")
	if err != nil {
		return 0, err
	}
	fields := fv.ToIDispatch()
	fields.AddRef()
	fv.Clear()
	defer insistRelease(fields)

	item, err := oleutil.GetProperty(fields, "Item", int64(index))
	if err != nil {
		return 0, err
	}
	f := item.ToIDispatch()
	f.AddRef()
	item.Clear()
	defer insistRelease(f)

	v, err := oleutil.GetProperty(f, "Value")
	if err != nil {
		return 0, err
	}
	defer v.Clear()
	return toInt64(v.Value())
}

func eofState(rs *ole.IDispatch) (bool, error) {
	v, err := oleutil.GetProperty(rs, "EOF")
	if err != nil {
		return false, err
	}
	defer v.Clear()
	b, ok := v.Value().(bool)
	if !ok {
		return false, fmt.Errorf("unexpected ADODB EOF type %T", v.Value())
	}
	return b, nil
}

func rowValues(rs *ole.IDispatch, colCount int) ([]any, error) {
	fv, err := oleutil.GetProperty(rs, "Fields")
	if err != nil {
		return nil, err
	}
	fields := fv.ToIDispatch()
	fields.AddRef()
	fv.Clear()
	defer insistRelease(fields)

	vals := make([]any, colCount)
	for i := 0; i < colCount; i++ {
		item, err := oleutil.GetProperty(fields, "Item", int64(i))
		if err != nil {
			return nil, err
		}
		f := item.ToIDispatch()
		f.AddRef()
		item.Clear()
		v, err := oleutil.GetProperty(f, "Value")
		f.Release()
		if err != nil {
			return nil, err
		}
		vals[i] = v.Value()
		v.Clear()
	}
	return vals, nil
}

func toTime(v any) time.Time {
	if t, ok := v.(time.Time); ok {
		return t
	}
	return time.Time{}
}

func toInt64(v any) (int64, error) {
	switch t := v.(type) {
	case nil:
		return 0, nil
	case int32:
		return int64(t), nil
	case int64:
		return t, nil
	case int16:
		return int64(t), nil
	case int:
		return int64(t), nil
	case float64:
		return int64(t), nil
	case string:
		return strconv.ParseInt(strings.TrimSpace(t), 10, 64)
	default:
		return 0, fmt.Errorf("unexpected scalar type %T", v)
	}
}

func toInt64OrDefault(v any) int64 {
	n, _ := toInt64(v)
	return n
}

func toString(v any) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return t
	case []byte:
		return string(t)
	case int32:
		return strconv.Itoa(int(t))
	case int64:
		return strconv.FormatInt(t, 10)
	case int:
		return strconv.Itoa(t)
	case float64:
		if t == float64(int64(t)) {
			return strconv.FormatInt(int64(t), 10)
		}
		return strconv.FormatFloat(t, 'f', -1, 64)
	default:
		return fmt.Sprintf("%v", v)
	}
}

func insistRelease(d *ole.IDispatch) { d.Release() }