package models

import (
	"time"

	"github.com/google/uuid"
)

// PunchRecord is a single raw punch log row (not attendance calculation).
type PunchRecord struct {
	ID          uuid.UUID `gorm:"type:nvarchar(36);primaryKey;column:Id" json:"id"`
	LogFileID   uuid.UUID `gorm:"type:nvarchar(36);column:LogFileId;index" json:"logFileId"`
	CompanyID   int       `gorm:"column:CompanyId;uniqueIndex:ux_punch_dedupe,priority:1;index:idx_punch_company_time,priority:1" json:"companyId"`
	PunchNumber int       `gorm:"column:PunchNumber;uniqueIndex:ux_punch_dedupe,priority:2;index:idx_punch_emp_time,priority:1" json:"punchNumber"`
	DeviceID    string    `gorm:"type:nvarchar(64);column:DeviceId;uniqueIndex:ux_punch_dedupe,priority:3" json:"deviceId"`
	PunchTime   time.Time `gorm:"column:PunchTime;uniqueIndex:ux_punch_dedupe,priority:4;index:idx_punch_company_time,priority:2;index:idx_punch_emp_time,priority:2" json:"punchTime"`
	Source      string    `gorm:"type:nvarchar(64);column:Source" json:"source"`
	CreatedAt   time.Time `gorm:"column:CreatedAt" json:"createdAt"`
}

func (PunchRecord) TableName() string { return "PunchRecords" }
