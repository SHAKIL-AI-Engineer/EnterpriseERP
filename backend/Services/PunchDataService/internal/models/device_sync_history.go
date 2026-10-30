package models

import (
	"time"

	"github.com/google/uuid"
)

const (
	SyncTriggerManual    = "Manual"
	SyncTriggerScheduled = "Scheduled"

	SyncStatusSuccess = "Success"
	SyncStatusFailed  = "Failed"
)

// DeviceSyncHistory records each device sync attempt (manual or scheduled).
type DeviceSyncHistory struct {
	ID             uuid.UUID  `gorm:"type:nvarchar(36);primaryKey;column:Id" json:"id"`
	CompanyID      int        `gorm:"column:CompanyId;index" json:"companyId"`
	MachineID      uuid.UUID  `gorm:"type:nvarchar(36);column:MachineId;index" json:"machineId"`
	TriggerType    string     `gorm:"type:nvarchar(32);column:TriggerType" json:"triggerType"`
	SyncStartedAt  time.Time  `gorm:"column:SyncStartedAt;index" json:"syncStartedAt"`
	SyncEndedAt    *time.Time `gorm:"column:SyncEndedAt" json:"syncEndedAt,omitempty"`
	TotalLogs      int        `gorm:"column:TotalLogs" json:"totalLogs"`
	NewLogs        int        `gorm:"column:NewLogs" json:"newLogs"`
	DuplicateLogs  int        `gorm:"column:DuplicateLogs" json:"duplicateLogs"`
	FailedLogs     int        `gorm:"column:FailedLogs" json:"failedLogs"`
	Status         string     `gorm:"type:nvarchar(32);column:Status;index" json:"status"`
	ErrorMessage   *string    `gorm:"type:nvarchar(max);column:ErrorMessage" json:"errorMessage,omitempty"`
	LogFileID      *uuid.UUID `gorm:"type:nvarchar(36);column:LogFileId" json:"logFileId,omitempty"`
}

func (DeviceSyncHistory) TableName() string { return "DeviceSyncHistories" }
