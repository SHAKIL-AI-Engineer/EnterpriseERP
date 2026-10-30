package repository

import (
	"context"
	"time"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Repository is the data-access surface for log files and processed punches.
type Repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Repository { return &Repository{db: db} }

// CreateLogFile inserts a new payload row.
func (r *Repository) CreateLogFile(ctx context.Context, lf *models.PunchLogFile) error {
	return r.db.WithContext(ctx).Create(lf).Error
}

// UpdateLogFile saves changes to an existing payload row.
func (r *Repository) UpdateLogFile(ctx context.Context, lf *models.PunchLogFile) error {
	return r.db.WithContext(ctx).Save(lf).Error
}

// GetLogFile fetches a log file by id (without the raw payload column to keep
// list/detail responses small; callers that need the bytes should use
// GetLogFileWithPayload).
func (r *Repository) GetLogFile(ctx context.Context, id uuid.UUID) (*models.PunchLogFile, error) {
	var lf models.PunchLogFile
	err := r.db.WithContext(ctx).
		Select("Id, ImportBatchId, FileName, SourceType, ContentType, DeviceId, CompanyId, SizeBytes, RecordCount, Status, ErrorMessage, UploadedAt, ProcessedAt").
		First(&lf, "Id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &lf, nil
}

// GetLogFileWithPayload returns the row including RawPayload.
func (r *Repository) GetLogFileWithPayload(ctx context.Context, id uuid.UUID) (*models.PunchLogFile, error) {
	var lf models.PunchLogFile
	err := r.db.WithContext(ctx).First(&lf, "Id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &lf, nil
}

// LogFileFilter describes the optional list filters.
type LogFileFilter struct {
	CompanyID *int
	DeviceID  string
	Status    string
	Page      int
	PageSize  int
}

// ListLogFiles returns a paginated slice plus total count.
func (r *Repository) ListLogFiles(ctx context.Context, f LogFileFilter) ([]models.PunchLogFile, int64, error) {
	applyFilters := func(q *gorm.DB) *gorm.DB {
		q = q.Model(&models.PunchLogFile{})
		if f.CompanyID != nil && *f.CompanyID > 0 {
			q = q.Where("CompanyId = ?", *f.CompanyID)
		}
		if f.DeviceID != "" {
			q = q.Where("DeviceId = ?", f.DeviceID)
		}
		if f.Status != "" {
			q = q.Where("Status = ?", f.Status)
		}
		return q
	}

	var total int64
	if err := applyFilters(r.db.WithContext(ctx)).Count(&total).Error; err != nil {
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

	var items []models.PunchLogFile
	err := applyFilters(r.db.WithContext(ctx)).
		Select("Id, ImportBatchId, FileName, SourceType, ContentType, DeviceId, CompanyId, SizeBytes, RecordCount, Status, ErrorMessage, UploadedAt, ProcessedAt").
		Order("UploadedAt DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&items).Error
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

// ListPendingLogFiles returns all pending payloads (used by /process).
func (r *Repository) ListPendingLogFiles(ctx context.Context, limit int) ([]models.PunchLogFile, error) {
	if limit <= 0 {
		limit = 50
	}
	var items []models.PunchLogFile
	err := r.db.WithContext(ctx).
		Where("Status = ?", models.StatusPending).
		Order("UploadedAt ASC").
		Limit(limit).
		Find(&items).Error
	return items, err
}

// InsertPunchRecords bulk-inserts processed punches in chunks.
func (r *Repository) InsertPunchRecords(ctx context.Context, records []models.PunchRecord) error {
	if len(records) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).CreateInBatches(records, 500).Error
}

// DeletePunchRecordsForLog removes previously-imported records for a log file
// (used when re-processing a payload).
func (r *Repository) DeletePunchRecordsForLog(ctx context.Context, logID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("LogFileId = ?", logID).
		Delete(&models.PunchRecord{}).Error
}

// PunchFilter describes filters for the punches list endpoint.
type PunchFilter struct {
	CompanyID   *int
	PunchNumber *int
	DeviceID    string
	From         *time.Time
	To           *time.Time
	LogFileID    *uuid.UUID
	Page         int
	PageSize     int
}

// ListPunches returns a paginated set of normalised punch events.
func (r *Repository) ListPunches(ctx context.Context, f PunchFilter) ([]models.PunchRecord, int64, error) {
	applyFilters := func(q *gorm.DB) *gorm.DB {
		q = q.Model(&models.PunchRecord{})
		if f.CompanyID != nil && *f.CompanyID > 0 {
			q = q.Where("CompanyId = ?", *f.CompanyID)
		}
		if f.PunchNumber != nil && *f.PunchNumber > 0 {
			q = q.Where("PunchNumber = ?", *f.PunchNumber)
		}
		if f.DeviceID != "" {
			q = q.Where("DeviceId = ?", f.DeviceID)
		}
		if f.LogFileID != nil {
			q = q.Where("LogFileId = ?", *f.LogFileID)
		}
		if f.From != nil {
			q = q.Where("PunchTime >= ?", *f.From)
		}
		if f.To != nil {
			q = q.Where("PunchTime <= ?", *f.To)
		}
		return q
	}

	var total int64
	if err := applyFilters(r.db.WithContext(ctx)).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := f.Page
	if page < 1 {
		page = 1
	}
	size := f.PageSize
	if size < 1 || size > 500 {
		size = 100
	}

	var items []models.PunchRecord
	err := applyFilters(r.db.WithContext(ctx)).
		Order("PunchTime DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&items).Error
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}
