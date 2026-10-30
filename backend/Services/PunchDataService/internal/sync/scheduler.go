package sync

import (
	"context"
	"log/slog"
	"time"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/repository"
)

// Scheduler periodically syncs all active punch machines.
type Scheduler struct {
	repo     *repository.Repository
	syncSvc  *Service
	logger   *slog.Logger
	interval time.Duration
}

func NewScheduler(repo *repository.Repository, syncSvc *Service, logger *slog.Logger, interval time.Duration) *Scheduler {
	if interval <= 0 {
		interval = 30 * time.Minute
	}
	return &Scheduler{repo: repo, syncSvc: syncSvc, logger: logger, interval: interval}
}

func (s *Scheduler) Run(ctx context.Context) {
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	s.runOnce(ctx)
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.runOnce(ctx)
		}
	}
}

func (s *Scheduler) runOnce(ctx context.Context) {
	machines, err := s.repo.ListAllActivePunchMachines(ctx)
	if err != nil {
		s.logger.Error("scheduled sync list machines failed", "error", err)
		return
	}
	s.logger.Info("scheduled device sync started", "deviceCount", len(machines))
	for _, machine := range machines {
		result, err := s.syncSvc.SyncMachine(ctx, machine, models.SyncTriggerScheduled)
		if err != nil {
			s.logger.Warn("scheduled sync failed",
				"machineId", machine.ID,
				"deviceCode", machine.DeviceCode,
				"error", err,
			)
			continue
		}
		if result != nil && result.History != nil {
			h := result.History
			s.logger.Info("scheduled sync completed",
				"machineId", machine.ID,
				"deviceCode", machine.DeviceCode,
				"status", h.Status,
				"totalLogs", h.TotalLogs,
				"newLogs", h.NewLogs,
				"duplicateLogs", h.DuplicateLogs,
				"failedLogs", h.FailedLogs,
			)
		}
	}
	s.logger.Info("scheduled device sync finished",
		"deviceCount", len(machines),
		"nextRunIn", s.interval.String(),
	)
}
