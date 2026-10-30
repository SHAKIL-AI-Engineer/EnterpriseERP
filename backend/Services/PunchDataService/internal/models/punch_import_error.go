package models

import (
	"time"

	"github.com/google/uuid"
)

// PunchImportError stores a row-level validation failure from an import batch.
type PunchImportError struct {
	ID           uuid.UUID `gorm:"type:nvarchar(36);primaryKey;column:Id" json:"id"`
	ImportBatchID uuid.UUID `gorm:"type:nvarchar(36);column:ImportBatchId;index" json:"importBatchId"`
	CompanyID    int       `gorm:"column:CompanyId;index" json:"companyId"`
	RowNumber    int       `gorm:"column:RowNumber" json:"rowNumber"`
	RawRow       string    `gorm:"type:nvarchar(max);column:RawRow" json:"rawRow"`
	ErrorMessage string    `gorm:"type:nvarchar(max);column:ErrorMessage" json:"errorMessage"`
	CreatedAt    time.Time `gorm:"column:CreatedAt" json:"createdAt"`
}

func (PunchImportError) TableName() string { return "PunchImportErrors" }
