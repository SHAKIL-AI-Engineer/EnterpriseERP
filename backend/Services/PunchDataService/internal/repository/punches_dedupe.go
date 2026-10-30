package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
)

// SQL Server allows at most 2100 parameters per request. Chunk IN lists and inserts.
const (
	dedupeInClauseChunk = 400
	dedupeInsertBatch   = 100
)

type InsertPunchOutcome struct {
	Inserted   []models.PunchRecord
	Duplicates int
}

// InsertPunchRecordsDeduped inserts only punches that do not already exist for the
// same company, punch number, device, and punch time.
func (r *Repository) InsertPunchRecordsDeduped(ctx context.Context, records []models.PunchRecord) (InsertPunchOutcome, error) {
	out := InsertPunchOutcome{}
	if len(records) == 0 {
		return out, nil
	}

	companyID := records[0].CompanyID
	existing, err := r.loadExistingPunchKeys(ctx, companyID, records)
	if err != nil {
		return out, err
	}

	toInsert := make([]models.PunchRecord, 0, len(records))
	for _, rec := range records {
		key := punchDedupeKey(rec.PunchNumber, rec.DeviceID, rec.PunchTime)
		if existing[key] {
			out.Duplicates++
			continue
		}
		toInsert = append(toInsert, rec)
		existing[key] = true
	}

	if len(toInsert) == 0 {
		return out, nil
	}
	if err := r.db.WithContext(ctx).CreateInBatches(toInsert, dedupeInsertBatch).Error; err != nil {
		return out, err
	}
	out.Inserted = toInsert
	return out, nil
}

func punchDedupeKey(punchNumber int, device string, punchTime time.Time) string {
	return fmt.Sprintf("%d|%s|%s",
		punchNumber,
		strings.TrimSpace(device),
		timeutil.FormatPunchTime(punchTime),
	)
}

func (r *Repository) loadExistingPunchKeys(ctx context.Context, companyID int, records []models.PunchRecord) (map[string]bool, error) {
	existing := map[string]bool{}
	if len(records) == 0 {
		return existing, nil
	}

	punchNums := map[int]struct{}{}
	devs := map[string]struct{}{}
	var minTime, maxTime time.Time
	for i, rec := range records {
		punchNums[rec.PunchNumber] = struct{}{}
		devs[strings.TrimSpace(rec.DeviceID)] = struct{}{}
		if i == 0 || rec.PunchTime.Before(minTime) {
			minTime = rec.PunchTime
		}
		if i == 0 || rec.PunchTime.After(maxTime) {
			maxTime = rec.PunchTime
		}
	}
	numList := make([]int, 0, len(punchNums))
	for n := range punchNums {
		numList = append(numList, n)
	}
	devList := make([]string, 0, len(devs))
	for d := range devs {
		devList = append(devList, d)
	}

	for i := 0; i < len(numList); i += dedupeInClauseChunk {
		end := i + dedupeInClauseChunk
		if end > len(numList) {
			end = len(numList)
		}
		numChunk := numList[i:end]

		var rows []models.PunchRecord
		err := r.db.WithContext(ctx).
			Select("PunchNumber, DeviceId, PunchTime").
			Where("CompanyId = ?", companyID).
			Where("PunchNumber IN ?", numChunk).
			Where("DeviceId IN ?", devList).
			Where("PunchTime BETWEEN ? AND ?", minTime, maxTime).
			Find(&rows).Error
		if err != nil {
			return nil, err
		}
		for _, row := range rows {
			existing[punchDedupeKey(row.PunchNumber, row.DeviceID, row.PunchTime)] = true
		}
	}
	return existing, nil
}
