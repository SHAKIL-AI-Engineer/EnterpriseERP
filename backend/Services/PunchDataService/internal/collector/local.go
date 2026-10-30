package collector

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/enterprise-erp/punchdata/internal/events"
	"github.com/enterprise-erp/punchdata/internal/local"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/remote"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
	"github.com/google/uuid"
)

// LocalOptions configures paginated read-only import from the local ZKTeco Access MDB.
type LocalOptions struct {
	Source              string
	PageSize            int // default rows per MDB SELECT page
	MaxPageSize         int // max rows per MDB page when batchSize is set
	MaxRowsPerCollect   int // safety cap per API call (0 = unlimited)
	DefaultLookbackDays int // when from is omitted and useWatermark is false
}

// SessionOpener opens a fresh MDB session for a collect operation.
type SessionOpener func() (*local.Session, error)

// LocalService pulls punch logs from the local ZKTeco Access MDB (read-only via
// ODBC) and stores them in PunchRecords with deduplication.
type LocalService struct {
	repo      *repository.Repository
	open      SessionOpener
	publisher events.Publisher
	logger    *slog.Logger
	opts      LocalOptions
}

func NewLocalService(repo *repository.Repository, open SessionOpener, publisher events.Publisher, logger *slog.Logger, opts LocalOptions) *LocalService {
	if opts.PageSize <= 0 {
		opts.PageSize = 500
	}
	if opts.MaxPageSize <= 0 {
		opts.MaxPageSize = 2000
	}
	if opts.MaxRowsPerCollect <= 0 {
		opts.MaxRowsPerCollect = 200000
	}
	if opts.DefaultLookbackDays <= 0 {
		opts.DefaultLookbackDays = 62
	}
	if opts.Source == "" {
		opts.Source = "ZKTecoLocal"
	}
	if publisher == nil {
		publisher = events.NoopPublisher{}
	}
	return &LocalService{repo: repo, open: open, publisher: publisher, logger: logger, opts: opts}
}

type LocalCollectRequest struct {
	CompanyID    int
	From         *time.Time
	To           *time.Time
	BatchSize    int // MDB page size; 0 = default PageSize
	UseWatermark bool
}

type LocalCollectResult struct {
	History         *models.LocalCollectHistory `json:"history"`
	LogFile         *models.PunchLogFile        `json:"logFile,omitempty"`
	LocalRows       int                         `json:"localRows"`
	Inserted        int                         `json:"inserted"`
	Duplicates      int                         `json:"duplicates"`
	SkippedNoBadge  int                         `json:"skippedNoBadge"`
	UnmappedLocal   int                         `json:"unmappedLocal"`
	Pages           int                         `json:"pages"`
}

func (s *LocalService) Collect(ctx context.Context, req LocalCollectRequest) (*LocalCollectResult, error) {
	if req.CompanyID <= 0 {
		return nil, fmt.Errorf("companyId is required")
	}

	pageSize := req.BatchSize
	if pageSize <= 0 {
		pageSize = s.opts.PageSize
	}
	if pageSize > s.opts.MaxPageSize {
		pageSize = s.opts.MaxPageSize
	}

	to := timeutil.WallClock(timeutil.Now())
	if req.To != nil {
		to = timeutil.WallClock(*req.To)
	}

	from, err := s.resolveFrom(ctx, req)
	if err != nil {
		return nil, err
	}
	if !from.Before(to) {
		return nil, fmt.Errorf("from must be before to")
	}

	session, err := s.open()
	if err != nil {
		return nil, err
	}
	defer session.Close()

	history := &models.LocalCollectHistory{
		ID:        uuid.New(),
		CompanyID: req.CompanyID,
		Status:    models.CollectStatusFailed,
		FromTime:  from,
		ToTime:    to,
		StartedAt: timeutil.Now(),
	}
	if err := s.repo.CreateLocalCollectHistory(ctx, history); err != nil {
		return nil, err
	}

	finish := func(status string, stats repository.CollectStats, pages int, lf *models.PunchLogFile, cause error) (*LocalCollectResult, error) {
		var msg *string
		if cause != nil {
			m := trimCollectErr(cause)
			msg = &m
		}
		var logID *uuid.UUID
		if lf != nil {
			logID = &lf.ID
		}
		_ = s.repo.CompleteLocalCollectHistory(ctx, history.ID, status, stats, logID, msg)
		fresh, _ := s.repo.GetLocalCollectHistory(ctx, history.ID)
		return &LocalCollectResult{
			History:        fresh,
			LogFile:        lf,
			LocalRows:      stats.RemoteRows,
			Inserted:       stats.Inserted,
			Duplicates:     stats.Duplicates,
			SkippedNoBadge: stats.SkippedNoBadge,
			UnmappedLocal:  stats.UnmappedRemote,
			Pages:          pages,
		}, cause
	}

	logID := uuid.New()
	var allRemote []remote.RemotePunch
	stats := repository.CollectStats{}
	if unmapped, err := session.CountUnmappedCheckinOut(ctx, from, to); err != nil {
		s.logger.Warn("local collect unmapped count failed", "error", err)
	} else {
		stats.UnmappedRemote = int(unmapped)
		if unmapped > 0 {
			s.logger.Warn("local collect has CHECKINOUT rows without USERINFO or BADGENUMBER",
				"unmapped", unmapped,
				"from", from,
				"to", to,
			)
		}
	}

	cursor := from
	pages := 0
	maxRows := s.opts.MaxRowsPerCollect

	for stats.RemoteRows < maxRows {
		batch, err := session.FetchCheckinOut(ctx, cursor, to, pageSize)
		if err != nil {
			return finish(models.CollectStatusFailed, stats, pages, nil, err)
		}
		if len(batch) == 0 {
			break
		}
		pages++

		converted := remote.ToPunchRecords(logID, req.CompanyID, s.opts.Source, batch)
		if converted.Skipped > 0 {
			stats.SkippedNoBadge += converted.Skipped
			s.logger.Warn("local collect skipped punches with empty BADGENUMBER",
				"skipped", converted.Skipped,
				"page", pages,
			)
		}
		outcome, err := s.repo.InsertPunchRecordsDeduped(ctx, converted.Records)
		if err != nil {
			return finish(models.CollectStatusFailed, stats, pages, nil, err)
		}

		for _, rec := range outcome.Inserted {
			if pubErr := s.publisher.PublishPunchLogCollected(ctx, events.PunchLogCollectedPayload{
				EventID:      uuid.New(),
				OccurredOn:   timeutil.Now(),
				CompanyID:    rec.CompanyID,
				PunchID:      rec.ID,
				LogFileID:    rec.LogFileID,
				PunchNumber:  rec.PunchNumber,
				DeviceID:     rec.DeviceID,
				PunchTime:    rec.PunchTime,
				Source:       rec.Source,
			}); pubErr != nil {
				s.logger.Warn("publish PunchLogCollected failed", "punchId", rec.ID, "error", pubErr)
			}
		}

		allRemote = append(allRemote, batch...)
		stats.RemoteRows += len(batch)
		stats.Inserted += len(outcome.Inserted)
		stats.Duplicates += outcome.Duplicates

		lastTime := maxCollectCheckTime(batch)
		if !lastTime.After(cursor) {
			break
		}
		cursor = lastTime

		if len(batch) < pageSize {
			break
		}
		if stats.RemoteRows >= maxRows {
			s.logger.Info("local collect hit MaxRowsPerCollect cap", "maxRows", maxRows)
			break
		}
	}

	var lf *models.PunchLogFile
	if len(allRemote) > 0 {
		payload, err := json.Marshal(allRemote)
		if err != nil {
			return finish(models.CollectStatusFailed, stats, pages, nil, err)
		}
		lf = &models.PunchLogFile{
			ID:          logID,
			FileName:    fmt.Sprintf("local-zkteco-%s.json", history.StartedAt.Format("20060102T150405Z")),
			SourceType:  "LocalZktecoCollect",
			ContentType: "application/json",
			CompanyID:   req.CompanyID,
			SizeBytes:   int64(len(payload)),
			RowCount:    len(allRemote),
			Status:      models.StatusCompleted,
			UploadedAt:  history.StartedAt,
			ProcessedAt: ptrTime(timeutil.Now()),
			RawPayload:  payload,
		}
		if err := s.repo.CreateLogFile(ctx, lf); err != nil {
			return finish(models.CollectStatusFailed, stats, pages, nil, err)
		}
	}

	s.logger.Info("local punch collect completed",
		"companyId", req.CompanyID,
		"from", from,
		"to", to,
		"pages", pages,
		"localRows", stats.RemoteRows,
		"inserted", stats.Inserted,
		"duplicates", stats.Duplicates,
		"skippedNoBadge", stats.SkippedNoBadge,
		"unmappedLocal", stats.UnmappedRemote,
	)

	result, err := finish(models.CollectStatusSuccess, stats, pages, lf, nil)
	return result, err
}

func maxCollectCheckTime(rows []remote.RemotePunch) time.Time {
	var max time.Time
	for _, row := range rows {
		if max.IsZero() || row.CheckTime.After(max) {
			max = row.CheckTime
		}
	}
	return max
}

// Ping opens a session and confirms the MDB is reachable (read-only).
func (s *LocalService) Ping(ctx context.Context) error {
	session, err := s.open()
	if err != nil {
		return err
	}
	defer session.Close()
	return session.Ping(ctx)
}

// PreviewDetail returns mapped punch count (CHECKINOUT with USERINFO badge) and
// unmapped count in the window without importing.
func (s *LocalService) PreviewDetail(ctx context.Context, from, to time.Time) (mapped int64, unmapped int64, err error) {
	session, err := s.open()
	if err != nil {
		return 0, 0, err
	}
	defer session.Close()

	mapped, err = session.CountCheckinOut(ctx, from, to)
	if err != nil {
		return 0, 0, err
	}
	unmapped, err = session.CountUnmappedCheckinOut(ctx, from, to)
	if err != nil {
		return mapped, 0, err
	}
	return mapped, unmapped, nil
}

func (s *LocalService) resolveFrom(ctx context.Context, req LocalCollectRequest) (time.Time, error) {
	if req.From != nil {
		return timeutil.WallClock(*req.From), nil
	}
	if req.UseWatermark {
		if t, err := s.repo.WatermarkFromPunches(ctx, req.CompanyID, s.opts.Source); err != nil {
			return time.Time{}, err
		} else if t != nil {
			return *t, nil
		}
		if t, err := s.repo.WatermarkFromLocalCollect(ctx, req.CompanyID); err != nil {
			return time.Time{}, err
		} else if t != nil {
			return *t, nil
		}
	}
	lookback := time.Duration(s.opts.DefaultLookbackDays) * 24 * time.Hour
	return timeutil.Now().Add(-lookback), nil
}

func trimCollectErr(err error) string {
	msg := strings.TrimSpace(err.Error())
	if len(msg) > 1900 {
		msg = msg[:1900] + "..."
	}
	return msg
}