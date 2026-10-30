package models

import (
	"time"

	"github.com/google/uuid"
)

// PunchLogFileStatus enumerates the lifecycle stages of an ingested log payload.
const (
	StatusPending    = "Pending"
	StatusProcessing = "Processing"
	StatusCompleted  = "Completed"
	StatusFailed     = "Failed"
)

// PunchLogFile is the raw payload (CSV/JSON) received from a device or upstream
// system, retained for re-processing and download.
type PunchLogFile struct {
	ID            uuid.UUID  `gorm:"type:nvarchar(36);primaryKey;column:Id" json:"id"`
	ImportBatchID *uuid.UUID `gorm:"type:nvarchar(36);column:ImportBatchId;index" json:"importBatchId,omitempty"`
	FileName     string    `gorm:"type:nvarchar(256);column:FileName"        json:"fileName"`
	SourceType   string    `gorm:"type:nvarchar(32);column:SourceType"       json:"sourceType"`
	ContentType  string    `gorm:"type:nvarchar(128);column:ContentType"     json:"contentType"`
	DeviceID     string    `gorm:"type:nvarchar(64);column:DeviceId"         json:"deviceId"`
	CompanyID    int       `gorm:"column:CompanyId"                          json:"companyId"`
	SizeBytes    int64     `gorm:"column:SizeBytes"                          json:"sizeBytes"`
	RowCount     int       `gorm:"column:RecordCount"                        json:"rowCount"`
	Status       string    `gorm:"type:nvarchar(32);column:Status;index"     json:"status"`
	ErrorMessage *string   `gorm:"type:nvarchar(max);column:ErrorMessage"    json:"errorMessage,omitempty"`
	UploadedAt   time.Time `gorm:"column:UploadedAt"                         json:"uploadedAt"`
	ProcessedAt  *time.Time `gorm:"column:ProcessedAt"                       json:"processedAt,omitempty"`
	RawPayload   []byte    `gorm:"type:varbinary(max);column:RawPayload"     json:"-"`
}

func (PunchLogFile) TableName() string { return "PunchLogFiles" }
