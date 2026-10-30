package repository

import (
	"context"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SyncHistoryStats summarises one device sync run.
type SyncHistoryStats struct {
	TotalLogs     int
	NewLogs       int
	DuplicateLogs int
	FailedLogs    int
}

func (r *Repository) CreateDeviceSyncHistory(ctx context.Context, row *models.DeviceSyncHistory) error {
	return r.db.WithContext(ctx).Create(row).Error
}

func (r *Repository) CompleteDeviceSyncHistory(ctx context.Context, id uuid.UUID, status string, stats SyncHistoryStats, logFileID *uuid.UUID, errMsg *string) error {
	ended := timeutil.Now()
	return r.db.WithContext(ctx).Model(&models.DeviceSyncHistory{}).
		Where("Id = ?", id).
		Updates(map[string]any{
			"Status":        status,
			"TotalLogs":     stats.TotalLogs,
			"NewLogs":       stats.NewLogs,
			"DuplicateLogs": stats.DuplicateLogs,
			"FailedLogs":    stats.FailedLogs,
			"LogFileId":     logFileID,
			"ErrorMessage":  errMsg,
			"SyncEndedAt":   ended,
		}).Error
}

type SyncHistoryFilter struct {
	CompanyID *int
	MachineID *uuid.UUID
	Status    string
	Page      int
	PageSize  int
}

func (r *Repository) ListDeviceSyncHistories(ctx context.Context, f SyncHistoryFilter) ([]models.DeviceSyncHistory, int64, error) {
	apply := func(q *gorm.DB) *gorm.DB {
		q = q.Model(&models.DeviceSyncHistory{})
		if f.CompanyID != nil && *f.CompanyID > 0 {
			q = q.Where("CompanyId = ?", *f.CompanyID)
		}
		if f.MachineID != nil {
			q = q.Where("MachineId = ?", *f.MachineID)
		}
		if f.Status != "" {
			q = q.Where("Status = ?", f.Status)
		}
		return q
	}

	var total int64
	if err := apply(r.db.WithContext(ctx)).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := f.Page
	if page < 1 {
		page = 1
	}
	size := f.PageSize
	if size < 1 || size > 200 {
		size = 50
	}

	var items []models.DeviceSyncHistory
	err := apply(r.db.WithContext(ctx)).
		Order("SyncStartedAt DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&items).Error
	return items, total, err
}

func (r *Repository) GetDeviceSyncHistory(ctx context.Context, id uuid.UUID) (*models.DeviceSyncHistory, error) {
	var row models.DeviceSyncHistory
	if err := r.db.WithContext(ctx).First(&row, "Id = ?", id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *Repository) ListAllActivePunchMachines(ctx context.Context) ([]models.PunchMachine, error) {
	var items []models.PunchMachine
	err := r.db.WithContext(ctx).
		Where("IsActive = ?", true).
		Order("CompanyId ASC, MachineNo ASC").
		Find(&items).Error
	return items, err
}
