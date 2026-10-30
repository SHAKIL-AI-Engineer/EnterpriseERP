package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ImportJob tracks bulk import operations.
type ImportJob struct {
	ID                 uuid.UUID `gorm:"type:uniqueidentifier;primaryKey"`
	CompanyID          uuid.UUID `gorm:"type:uniqueidentifier;index"`
	ModuleName         string    `gorm:"size:64;index"`
	ImportType         string    `gorm:"size:32"` // Excel, CSV
	FileName           string    `gorm:"size:512"`
	FilePath           string    `gorm:"size:1024"`
	ErrorFilePath      string    `gorm:"size:1024"`
	TotalRows          int
	SuccessRows        int
	FailedRows         int
	CreatedRows        int
	UpdatedRows        int
	Status             string `gorm:"size:32;index"`
	StartedAt          *time.Time
	CompletedAt        *time.Time
	CreatedBy          uuid.UUID `gorm:"type:uniqueidentifier"`
	CreatedAt          time.Time
	Remarks            string `gorm:"size:2000"`
	ProgressPercentage int
	PreviewSession     string `gorm:"type:uniqueidentifier"` // links to preview for confirm
}

func (ImportJob) TableName() string { return "ImportJobs" }

func (j *ImportJob) BeforeCreate(tx *gorm.DB) error {
	if j.ID == uuid.Nil {
		j.ID = uuid.New()
	}
	return nil
}

// ImportAuditLog records completed bulk import outcomes for operational review.
type ImportAuditLog struct {
	ID          uuid.UUID `gorm:"type:uniqueidentifier;primaryKey"`
	ImportJobID uuid.UUID `gorm:"type:uniqueidentifier;index"`
	CompanyID   uuid.UUID `gorm:"type:uniqueidentifier;index"`
	ModuleName  string    `gorm:"size:64;index"`
	TotalRows   int
	SuccessRows int
	FailedRows  int
	Status      string `gorm:"size:32;index"`
	DurationMs  int64
	CreatedBy   uuid.UUID `gorm:"type:uniqueidentifier"`
	CreatedAt   time.Time
}

func (ImportAuditLog) TableName() string { return "ImportAuditLogs" }

func (l *ImportAuditLog) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

// ExportJob tracks export operations.
type ExportJob struct {
	ID          uuid.UUID `gorm:"type:uniqueidentifier;primaryKey"`
	CompanyID   uuid.UUID `gorm:"type:uniqueidentifier;index"`
	ModuleName  string    `gorm:"size:64;index"`
	ExportType  string    `gorm:"size:64"`
	FileName    string    `gorm:"size:512"`
	FilePath    string    `gorm:"size:1024"`
	Format      string    `gorm:"size:16"`
	Status      string    `gorm:"size:32;index"`
	FilterJSON  string    `gorm:"type:nvarchar(max)"`
	CreatedBy   uuid.UUID `gorm:"type:uniqueidentifier"`
	CreatedAt   time.Time
	CompletedAt *time.Time
}

func (ExportJob) TableName() string { return "ExportJobs" }

func (j *ExportJob) BeforeCreate(tx *gorm.DB) error {
	if j.ID == uuid.Nil {
		j.ID = uuid.New()
	}
	return nil
}

// ImportJobError row-level validation/persist errors.
type ImportJobError struct {
	ID          uuid.UUID `gorm:"type:uniqueidentifier;primaryKey"`
	ImportJobID uuid.UUID `gorm:"type:uniqueidentifier;index"`
	RowNumber   int
	Column      string `gorm:"size:128"`
	Message     string `gorm:"size:2000"`
	CreatedAt   time.Time
}

func (ImportJobError) TableName() string { return "ImportJobErrors" }

func (e *ImportJobError) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// ImportTemplate metadata for downloadable templates.
type ImportTemplate struct {
	ID          uuid.UUID  `gorm:"type:uniqueidentifier;primaryKey"`
	CompanyID   *uuid.UUID `gorm:"type:uniqueidentifier;index"`
	ModuleName  string     `gorm:"size:64;index"`
	Version     int
	FilePath    string `gorm:"size:1024"`
	Description string `gorm:"size:500"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (ImportTemplate) TableName() string { return "ImportTemplates" }

func (t *ImportTemplate) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// FileStorageRecord audit for stored binaries.
type FileStorageRecord struct {
	ID           uuid.UUID `gorm:"type:uniqueidentifier;primaryKey"`
	OriginalName string    `gorm:"size:512"`
	StoredPath   string    `gorm:"size:1024"`
	MimeType     string    `gorm:"size:128"`
	SizeBytes    int64
	SHA256       string    `gorm:"size:64"`
	CompanyID    uuid.UUID `gorm:"type:uniqueidentifier;index"`
	CreatedBy    uuid.UUID `gorm:"type:uniqueidentifier"`
	CreatedAt    time.Time
}

func (FileStorageRecord) TableName() string { return "FileStorageRecords" }

func (f *FileStorageRecord) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

// ImportPreviewSession holds parsed rows JSON until confirm.
type ImportPreviewSession struct {
	ID          uuid.UUID `gorm:"type:uniqueidentifier;primaryKey"`
	CompanyID   uuid.UUID `gorm:"type:uniqueidentifier;index"`
	ModuleName  string    `gorm:"size:64"`
	FileName    string    `gorm:"size:512"`
	FilePath    string    `gorm:"size:1024"`
	PayloadJSON string    `gorm:"type:nvarchar(max)"` // validated rows + errors summary
	ExpiresAt   time.Time `gorm:"index"`
	CreatedBy   uuid.UUID `gorm:"type:uniqueidentifier"`
	CreatedAt   time.Time
}

func (ImportPreviewSession) TableName() string { return "ImportPreviewSessions" }

func (s *ImportPreviewSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// ImportStagingRow optional persisted staging after successful confirm (integration hook).
type ImportStagingRow struct {
	ID          uuid.UUID `gorm:"type:uniqueidentifier;primaryKey"`
	ImportJobID uuid.UUID `gorm:"type:uniqueidentifier;index"`
	RowNumber   int
	ModuleName  string `gorm:"size:64"`
	PayloadJSON string `gorm:"type:nvarchar(max)"`
	Status      string `gorm:"size:32"` // Staged, Applied, Rejected
	CreatedAt   time.Time
}

func (ImportStagingRow) TableName() string { return "ImportStagingRows" }

func (r *ImportStagingRow) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
