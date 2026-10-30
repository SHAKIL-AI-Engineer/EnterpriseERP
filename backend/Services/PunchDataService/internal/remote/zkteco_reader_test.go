package remote

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestToPunchRecords_UsesBadgeAsPunchNumber(t *testing.T) {
	logID := uuid.New()
	rows := []RemotePunch{{
		UserID:      1,
		BadgeNumber: "38",
		CheckTime:   time.Date(2026, 1, 22, 8, 27, 21, 0, time.UTC),
		CheckType:   "I",
		SensorID:    "101",
	}}
	result := ToPunchRecords(logID, 1, "ZKTecoRemote", rows)
	if len(result.Records) != 1 {
		t.Fatalf("expected 1 record, got %d (skipped=%d)", len(result.Records), result.Skipped)
	}
	if result.Records[0].PunchNumber != 38 {
		t.Fatalf("PunchNumber = %d, want 38", result.Records[0].PunchNumber)
	}
}

func TestToPunchRecords_SkipsInvalidBadge(t *testing.T) {
	logID := uuid.New()
	rows := []RemotePunch{{
		UserID:      99,
		BadgeNumber: "EMP-1",
		CheckTime:   time.Now(),
		CheckType:   "I",
	}}
	result := ToPunchRecords(logID, 1, "ZKTecoRemote", rows)
	if len(result.Records) != 0 || result.Skipped != 1 {
		t.Fatalf("expected skip, got records=%d skipped=%d", len(result.Records), result.Skipped)
	}
}
