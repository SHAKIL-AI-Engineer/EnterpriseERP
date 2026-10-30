package timeutil

import (
	"testing"
	"time"
)

func TestParsePunchTime_RFC3339WithOffset_KeepsWallClock(t *testing.T) {
	got, err := ParsePunchTime("2026-05-13T08:00:15+06:00")
	if err != nil {
		t.Fatal(err)
	}
	if got.Year() != 2026 || got.Month() != 5 || got.Day() != 13 ||
		got.Hour() != 8 || got.Minute() != 0 || got.Second() != 15 {
		t.Fatalf("wall clock = %v, want 2026-05-13 08:00:15", got)
	}
}

func TestParsePunchTime_Naive_KeepsWallClock(t *testing.T) {
	got, err := ParsePunchTime("2026-05-13 08:00:15")
	if err != nil {
		t.Fatal(err)
	}
	if got.Hour() != 8 || got.Minute() != 0 {
		t.Fatalf("wall clock = %v", got)
	}
}

func TestParsePunchTime_Zulu_KeepsWallClockComponents(t *testing.T) {
	got, err := ParsePunchTime("2026-05-13T08:00:15Z")
	if err != nil {
		t.Fatal(err)
	}
	if got.Hour() != 8 {
		t.Fatalf("wall clock hour = %d, want 8 (face value from Z)", got.Hour())
	}
}

func TestFormatPunchTime_NoDhakaShift(t *testing.T) {
	stored := time.Date(2026, 5, 13, 8, 0, 15, 0, time.UTC)
	got := FormatPunchTime(stored)
	want := "2026-05-13T08:00:15"
	if got != want {
		t.Fatalf("FormatPunchTime = %q, want %q", got, want)
	}
}

func TestNow_IsDhakaAuditTime(t *testing.T) {
	now := Now()
	loc := Location()
	if now.Location().String() != loc.String() {
		t.Fatalf("Now location = %v, want %v", now.Location(), loc)
	}
	offset, _ := now.Zone()
	if offset != "+0600" && offset != "BST" && offset != "GMT+6" {
		_, offSec := now.Zone()
		if offSec != 6*3600 {
			t.Fatalf("Now offset = %s (%d sec)", offset, offSec)
		}
	}
}
