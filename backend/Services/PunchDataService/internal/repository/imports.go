package repository

import (
	"context"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (r *Repository) CreateImportBatch(ctx context.Context, batch *models.PunchImportBatch) error {
	return r.db.WithContext(ctx).Create(batch).Error
}

func (r *Repository) UpdateImportBatch(ctx context.Context, batch *models.PunchImportBatch) error {
	return r.db.WithContext(ctx).Save(batch).Error
}

func (r *Repository) GetImportBatch(ctx context.Context, id uuid.UUID) (*models.PunchImportBatch, error) {
	var batch models.PunchImportBatch
	if err := r.db.WithContext(ctx).First(&batch, "Id = ?", id).Error; err != nil {
		return nil, err
	}
	return &batch, nil
}

type ImportBatchFilter struct {
	CompanyID *int
	Status    string
	Page      int
	PageSize  int
}

func (r *Repository) ListImportBatches(ctx context.Context, f ImportBatchFilter) ([]models.PunchImportBatch, int64, error) {
	apply := func(q *gorm.DB) *gorm.DB {
		q = q.Model(&models.PunchImportBatch{})
		if f.CompanyID != nil && *f.CompanyID > 0 {
			q = q.Where("CompanyId = ?", *f.CompanyID)
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
	var items []models.PunchImportBatch
	err := apply(r.db.WithContext(ctx)).
		Order("UploadedAt DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&items).Error
	return items, total, err
}

func (r *Repository) InsertImportErrors(ctx context.Context, rows []models.PunchImportError) error {
	if len(rows) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).CreateInBatches(rows, 200).Error
}

func (r *Repository) ListImportErrors(ctx context.Context, batchID uuid.UUID, page, pageSize int) ([]models.PunchImportError, int64, error) {
	q := r.db.WithContext(ctx).Model(&models.PunchImportError{}).Where("ImportBatchId = ?", batchID)
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 500 {
		pageSize = 100
	}
	var items []models.PunchImportError
	err := q.Order("RowNumber ASC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&items).Error
	return items, total, err
}

