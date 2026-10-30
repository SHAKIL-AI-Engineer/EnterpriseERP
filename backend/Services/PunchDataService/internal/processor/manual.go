package processor

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/enterprise-erp/punchdata/internal/events"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
	"github.com/google/uuid"
)

type ManualPunchRequest struct {
	CompanyID   int
	PunchNumber int
	DeviceID    string
	PunchTime   time.Time
	Source      string
}

// CreateManualPunch stores a single raw punch row and publishes PunchLogCollected.
func (s *Service) CreateManualPunch(ctx context.Context, req ManualPunchRequest) (*models.PunchRecord, bool, error) {
	if req.PunchNumber <= 0 {
		return nil, false, fmt.Errorf("punchNumber must be a positive integer")
	}
	if req.CompanyID <= 0 {
		return nil, false, fmt.Errorf("companyId is required")
	}
	device := strings.TrimSpace(req.DeviceID)
	if device == "" {
		device = "MANUAL"
	}
	source := strings.TrimSpace(req.Source)
	if source == "" {
		source = "Manual"
	}
	pt := timeutil.WallClock(req.PunchTime)
	if pt.IsZero() {
		pt = timeutil.WallClock(timeutil.Now())
	}

	rec := models.PunchRecord{
		ID:          uuid.New(),
		LogFileID:   uuid.Nil,
		CompanyID:   req.CompanyID,
		PunchNumber: req.PunchNumber,
		DeviceID:    device,
		PunchTime:   pt,
		Source:      source,
		CreatedAt:   timeutil.Now(),
	}

	outcome, err := s.repo.InsertPunchRecordsDeduped(ctx, []models.PunchRecord{rec})
	if err != nil {
		return nil, false, err
	}
	if len(outcome.Inserted) == 0 {
		return nil, true, nil
	}
	inserted := outcome.Inserted[0]
	if pubErr := s.publisher.PublishPunchLogCollected(ctx, events.PunchLogCollectedPayload{
		EventID:     uuid.New(),
		OccurredOn:  timeutil.Now(),
		CompanyID:   inserted.CompanyID,
		PunchID:     inserted.ID,
		LogFileID:   inserted.LogFileID,
		PunchNumber: inserted.PunchNumber,
		DeviceID:    inserted.DeviceID,
		PunchTime:   inserted.PunchTime,
		Source:      inserted.Source,
	}); pubErr != nil {
		s.logger.Warn("publish PunchLogCollected failed", "punchId", inserted.ID, "error", pubErr)
	}
	return &inserted, false, nil
}
