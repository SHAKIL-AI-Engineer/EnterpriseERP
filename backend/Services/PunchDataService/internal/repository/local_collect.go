package repository

import (
	"context"
	"time"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (r *Repository) CreateLocalCollectHistory(ctx context.Context, h *models.LocalCollectHistory) error {
	return r.db.WithContext(ctx).Create(h).Error
}

func (r *Repository) CompleteLocalCollectHistory(ctx context.Context, id uuid.UUID, status string, stats CollectStats, logFileID *uuid.UUID, errMsg *string) error {
	now := time.Now().UTC()
	return r.db.WithContext(ctx).Model(&models.LocalCollectHistory{}).
		Where("Id = ?", id).
		Updates(map[string]any{
			"Status":         status,
			"LocalRows":      stats.RemoteRows,
			"Inserted":       stats.Inserted,
			"Duplicates":     stats.Duplicates,
			"SkippedNoBadge": stats.SkippedNoBadge,
			"UnmappedLocal":  stats.UnmappedRemote,
			"LogFileId":      logFileID,
			"ErrorMessage":   errMsg,
			"CompletedAt":    &now,
		}).Error
}

func (r *Repository) GetLocalCollectHistory(ctx context.Context, id uuid.UUID) (*models.LocalCollectHistory, error) {
	var h models.LocalCollectHistory
	err := r.db.WithContext(ctx).First(&h, "Id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *Repository) ListLocalCollectHistories(ctx context.Context, companyID int, page, pageSize int) ([]models.LocalCollectHistory, int64, error) {
	q := r.db.WithContext(ctx).Model(&models.LocalCollectHistory{})
	if companyID > 0 {
		q = q.Where("CompanyId = ?", companyID)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	var items []models.LocalCollectHistory
	err := q.Order("StartedAt DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error
	return items, total, err
}

func (r *Repository) WatermarkFromLocalCollect(ctx context.Context, companyID int) (*time.Time, error) {
	var h models.LocalCollectHistory
	err := r.db.WithContext(ctx).
		Where("CompanyId = ? AND Status = ?", companyID, models.CollectStatusSuccess).
		Order("ToTime DESC").
		Limit(1).
		First(&h).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	t := h.ToTime
	return &t, nil
}