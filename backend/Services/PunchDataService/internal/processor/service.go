package processor

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/enterprise-erp/punchdata/internal/events"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/google/uuid"
)

// Service normalises raw punch payloads into PunchRecord rows only.
// Attendance calculation is owned by AttendanceService.
type Service struct {
	repo          *repository.Repository
	logger        *slog.Logger
	publisher     events.Publisher
	defaultSource string
}

func NewService(repo *repository.Repository, logger *slog.Logger, publisher events.Publisher, defaultSource string) *Service {
	if publisher == nil {
		publisher = events.NoopPublisher{}
	}
	if defaultSource == "" {
		defaultSource = "Device"
	}
	return &Service{repo: repo, logger: logger, publisher: publisher, defaultSource: defaultSource}
}

// ProcessOptions controls ingest side-effects.
type ProcessOptions struct {
	ImportBatchID *uuid.UUID
}

// Result summarises a single raw-log normalisation run.
type Result struct {
	LogFileID    uuid.UUID `json:"logFileId"`
	Status       string    `json:"status"`
	RowCount     int       `json:"rowCount"`
	Inserted     int       `json:"inserted"`
	Skipped      int       `json:"skipped"`
	Duplicates   int       `json:"duplicates"`
	FailedLogs   int       `json:"failedLogs"`
	ProcessedAt  time.Time `json:"processedAt"`
	ErrorMessage string    `json:"errorMessage,omitempty"`
	Warnings     []string  `json:"warnings,omitempty"`
}

// ProcessLogFile parses, normalises, deduplicates, and persists raw punch rows.
func (s *Service) ProcessLogFile(ctx context.Context, id uuid.UUID, opts ProcessOptions) (*Result, error) {
	lf, err := s.repo.GetLogFileWithPayload(ctx, id)
	if err != nil {
		return nil, err
	}

	lf.Status = models.StatusProcessing
	lf.ErrorMessage = nil
	if err := s.repo.UpdateLogFile(ctx, lf); err != nil {
		return nil, fmt.Errorf("mark processing: %w", err)
	}

	res := &Result{LogFileID: lf.ID, ProcessedAt: time.Now().UTC()}

	if err := s.repo.DeletePunchRecordsForLog(ctx, lf.ID); err != nil {
		return s.fail(ctx, lf, res, fmt.Errorf("clear previous records: %w", err))
	}

	batch, err := Parse(lf.ContentType, lf.FileName, lf.RawPayload)
	if err != nil {
		return s.fail(ctx, lf, res, fmt.Errorf("parse payload: %w", err))
	}

	defaults := Defaults{
		CompanyID: lf.CompanyID,
		DeviceID:  lf.DeviceID,
		Source:    s.defaultSource,
	}
	rows, warnings := Normalize(ctx, lf.ID, batch, defaults)
	if err := s.persistImportErrors(ctx, opts.ImportBatchID, lf.CompanyID, warnings); err != nil {
		s.logger.Warn("failed to save import errors", "logFileId", lf.ID, "error", err)
	}

	outcome, err := s.repo.InsertPunchRecordsDeduped(ctx, rows)
	if err != nil {
		return s.fail(ctx, lf, res, fmt.Errorf("insert punches: %w", err))
	}

	for _, rec := range outcome.Inserted {
		if pubErr := s.publisher.PublishPunchLogCollected(ctx, events.PunchLogCollectedPayload{
			EventID:      uuid.New(),
			OccurredOn:   timeutil.Now(),
			CompanyID:    rec.CompanyID,
			PunchID:      rec.ID,
			LogFileID:    rec.LogFileID,
			PunchNumber: rec.PunchNumber,
			DeviceID:     rec.DeviceID,
			PunchTime:    rec.PunchTime,
			Source:       rec.Source,
		}); pubErr != nil {
			s.logger.Warn("publish PunchLogCollected failed", "punchId", rec.ID, "error", pubErr)
		}
	}

	now := time.Now().UTC()
	lf.RowCount = len(batch.Records)
	lf.Status = models.StatusCompleted
	lf.ProcessedAt = &now
	if err := s.repo.UpdateLogFile(ctx, lf); err != nil {
		s.logger.Warn("failed to update log file status to Completed", "logFileId", lf.ID, "error", err)
	}

	if opts.ImportBatchID != nil {
		if err := s.updateImportBatch(ctx, *opts.ImportBatchID, len(batch.Records), len(rows), len(warnings), len(outcome.Inserted), outcome.Duplicates, nil); err != nil {
			s.logger.Warn("failed to update import batch", "importBatchId", *opts.ImportBatchID, "error", err)
		}
	}

	res.RowCount = len(batch.Records)
	res.Inserted = len(outcome.Inserted)
	res.Duplicates = outcome.Duplicates
	res.FailedLogs = len(batch.Records) - len(rows)
	res.Skipped = res.FailedLogs + outcome.Duplicates
	res.Status = models.StatusCompleted
	res.Warnings = warnings
	res.ProcessedAt = now

	s.logger.Info("normalised raw punch log",
		"logFileId", lf.ID,
		"company", lf.CompanyID,
		"rows", res.RowCount,
		"inserted", res.Inserted,
		"duplicates", res.Duplicates,
		"skipped", res.Skipped,
	)
	return res, nil
}

// ProcessPending runs ProcessLogFile for every pending payload up to limit.
func (s *Service) ProcessPending(ctx context.Context, limit int) ([]Result, error) {
	pending, err := s.repo.ListPendingLogFiles(ctx, limit)
	if err != nil {
		return nil, err
	}
	results := make([]Result, 0, len(pending))
	for _, p := range pending {
		opts := ProcessOptions{}
		if p.ImportBatchID != nil {
			opts.ImportBatchID = p.ImportBatchID
		}
		r, err := s.ProcessLogFile(ctx, p.ID, opts)
		if err != nil {
			s.logger.Error("processing failed", "logFileId", p.ID, "error", err)
			continue
		}
		results = append(results, *r)
	}
	return results, nil
}

func (s *Service) persistImportErrors(ctx context.Context, batchID *uuid.UUID, companyID int, warnings []string) error {
	if batchID == nil || len(warnings) == 0 {
		return nil
	}
	now := time.Now().UTC()
	rows := make([]models.PunchImportError, 0, len(warnings))
	for i, msg := range warnings {
		rows = append(rows, models.PunchImportError{
			ID:            uuid.New(),
			ImportBatchID: *batchID,
			CompanyID:     companyID,
			RowNumber:     i + 1,
			RawRow:        "",
			ErrorMessage:  msg,
			CreatedAt:     now,
		})
	}
	return s.repo.InsertImportErrors(ctx, rows)
}

func (s *Service) updateImportBatch(ctx context.Context, batchID uuid.UUID, total, valid, invalid, inserted, duplicates int, errMsg *string) error {
	batch, err := s.repo.GetImportBatch(ctx, batchID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	batch.TotalRows = total
	batch.ValidRows = valid
	batch.InvalidRows = invalid
	batch.InsertedRows = inserted
	batch.DuplicateRows = duplicates
	batch.Status = models.ImportStatusCompleted
	batch.ProcessedAt = &now
	batch.ErrorMessage = errMsg
	return s.repo.UpdateImportBatch(ctx, batch)
}

func (s *Service) fail(ctx context.Context, lf *models.PunchLogFile, res *Result, cause error) (*Result, error) {
	msg := cause.Error()
	if len(msg) > 1900 {
		msg = msg[:1900] + "..."
	}
	trim := strings.TrimSpace(msg)
	lf.Status = models.StatusFailed
	lf.ErrorMessage = &trim
	if uerr := s.repo.UpdateLogFile(ctx, lf); uerr != nil {
		s.logger.Warn("failed to update log file status to Failed", "logFileId", lf.ID, "error", uerr)
	}
	if lf.ImportBatchID != nil {
		if batch, err := s.repo.GetImportBatch(ctx, *lf.ImportBatchID); err == nil {
			now := time.Now().UTC()
			batch.Status = models.ImportStatusFailed
			batch.ErrorMessage = &trim
			batch.ProcessedAt = &now
			_ = s.repo.UpdateImportBatch(ctx, batch)
		}
	}
	res.Status = models.StatusFailed
	res.ErrorMessage = trim
	return res, cause
}
