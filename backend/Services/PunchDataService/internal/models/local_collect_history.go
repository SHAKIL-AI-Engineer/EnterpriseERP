package models

import (
	"time"

	"github.com/google/uuid"
)

// LocalCollectHistory tracks read-only imports from the local ZKTeco Access MDB file.
type LocalCollectHistory struct {
	ID             uuid.UUID  `gorm:"type:nvarchar(36);primaryKey;column:Id" json:"id"`
	CompanyID      int        `gorm:"column:CompanyId;index" json:"companyId"`
	Status         string     `gorm:"type:nvarchar(32);column:Status" json:"status"`
	FromTime       time.Time  `gorm:"column:FromTime" json:"fromTime"`
	ToTime         time.Time  `gorm:"column:ToTime" json:"toTime"`
	LocalRows      int        `gorm:"column:LocalRows" json:"localRows"`
	Inserted       int        `gorm:"column:Inserted" json:"inserted"`
	Duplicates     int        `gorm:"column:Duplicates" json:"duplicates"`
	SkippedNoBadge int        `gorm:"column:SkippedNoBadge" json:"skippedNoBadge"`
	UnmappedLocal  int        `gorm:"column:UnmappedLocal" json:"unmappedLocal"`
	LogFileID      *uuid.UUID `gorm:"type:nvarchar(36);column:LogFileId" json:"logFileId,omitempty"`
	ErrorMessage   *string    `gorm:"type:nvarchar(max);column:ErrorMessage" json:"errorMessage,omitempty"`
	StartedAt      time.Time  `gorm:"column:StartedAt" json:"startedAt"`
	CompletedAt    *time.Time `gorm:"column:CompletedAt" json:"completedAt,omitempty"`
}

func (LocalCollectHistory) TableName() string { return "LocalCollectHistories" }