package models

import (
	"time"

	"github.com/google/uuid"
)

const (
	ImportStatusPending    = "Pending"
	ImportStatusProcessing = "Processing"
	ImportStatusCompleted  = "Completed"
	ImportStatusFailed     = "Failed"
)

// PunchImportBatch tracks Excel/CSV import runs.
type PunchImportBatch struct {
	ID            uuid.UUID  `gorm:"type:nvarchar(36);primaryKey;column:Id" json:"id"`
	CompanyID     int        `gorm:"column:CompanyId;index" json:"companyId"`
	FileName      string     `gorm:"type:nvarchar(256);column:FileName" json:"fileName"`
	ContentType   string     `gorm:"type:nvarchar(128);column:ContentType" json:"contentType"`
	Status        string     `gorm:"type:nvarchar(32);column:Status;index" json:"status"`
	TotalRows     int        `gorm:"column:TotalRows" json:"totalRows"`
	ValidRows     int        `gorm:"column:ValidRows" json:"validRows"`
	InvalidRows   int        `gorm:"column:InvalidRows" json:"invalidRows"`
	InsertedRows  int        `gorm:"column:InsertedRows" json:"insertedRows"`
	DuplicateRows int        `gorm:"column:DuplicateRows" json:"duplicateRows"`
	UploadedBy    *uuid.UUID `gorm:"type:nvarchar(36);column:UploadedBy" json:"uploadedBy,omitempty"`
	ErrorMessage  *string    `gorm:"type:nvarchar(max);column:ErrorMessage" json:"errorMessage,omitempty"`
	UploadedAt    time.Time  `gorm:"column:UploadedAt" json:"uploadedAt"`
	ProcessedAt   *time.Time `gorm:"column:ProcessedAt" json:"processedAt,omitempty"`
}

func (PunchImportBatch) TableName() string { return "PunchImportBatches" }
