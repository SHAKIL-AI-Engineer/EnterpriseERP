package timeutil

import (
	"strconv"
	"strings"
	"time"
)

const DefaultTimezone = "Asia/Dhaka"

var punchTimeLayouts = []string{
	time.RFC3339Nano,
	time.RFC3339,
	"2006-01-02T15:04:05",
	"2006-01-02 15:04:05",
	"2006-01-02 15:04",
	"02/01/2006 15:04:05",
	"02/01/2006 15:04",
	"01/02/2006 15:04:05",
	"01/02/2006 15:04",
	"2006/01/02 15:04:05",
}

// Location returns Asia/Dhaka (GMT+6) for audit timestamps only.
func Location() *time.Location {
	loc, err := time.LoadLocation(DefaultTimezone)
	if err != nil {
		return time.FixedZone("GMT+6", 6*60*60)
	}
	return loc
}

// Now returns the current time in Dhaka (+06:00) for CreatedAt / UpdatedAt audit fields.
func Now() time.Time {
	return time.Now().In(Location())
}

// InDhaka converts an instant to Dhaka wall-clock (audit / device diagnostics only — not for PunchTime storage).
func InDhaka(t time.Time) time.Time {
	return t.In(Location())
}

// WallClock extracts calendar date/time components without timezone conversion (actual log face value).
func WallClock(t time.Time) time.Time {
	return time.Date(
		t.Year(), t.Month(), t.Day(),
		t.Hour(), t.Minute(), t.Second(), t.Nanosecond(),
		time.UTC,
	)
}

// ParsePunchTime parses a punch timestamp and stores the wall-clock value from the source (no Dhaka shift).
func ParsePunchTime(raw string) (time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return time.Time{}, errEmptyPunchTime
	}

	if t, err := time.Parse(time.RFC3339Nano, raw); err == nil {
		return WallClock(t), nil
	}
	if t, err := time.Parse(time.RFC3339, raw); err == nil {
		return WallClock(t), nil
	}

	for _, layout := range punchTimeLayouts[2:] {
		if t, err := time.ParseInLocation(layout, raw, time.UTC); err == nil {
			return t, nil
		}
	}

	if n, err := strconv.ParseInt(raw, 10, 64); err == nil {
		if len(raw) >= 13 {
			return WallClock(time.UnixMilli(n)), nil
		}
		return WallClock(time.Unix(n, 0)), nil
	}
	return time.Time{}, errUnrecognizedPunchTime
}

// FormatPunchTime formats a stored punch time for dedupe keys and API (wall-clock, no Dhaka conversion).
func FormatPunchTime(t time.Time) string {
	return WallClock(t).Format("2006-01-02T15:04:05")
}

// ParseRangeTime parses from/to filter query values using the same wall-clock rules as punch times.
func ParseRangeTime(raw string) (time.Time, error) {
	return ParsePunchTime(raw)
}

var (
	errEmptyPunchTime        = &parseError{"empty punch time"}
	errUnrecognizedPunchTime = &parseError{"unrecognised punch time format"}
)

type parseError struct{ msg string }

func (e *parseError) Error() string { return e.msg }
