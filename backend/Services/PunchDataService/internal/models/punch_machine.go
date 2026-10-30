package models

import (
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	MachineStatusUnknown      = "Unknown"
	MachineStatusConnected    = "Connected"
	MachineStatusDisconnected = "Disconnected"
)

// PunchMachine stores the LAN connection details for a biometric punch device.
type PunchMachine struct {
	ID                   uuid.UUID  `gorm:"type:nvarchar(36);primaryKey;column:Id" json:"id"`
	CompanyID            int        `gorm:"column:CompanyId;uniqueIndex:ux_punch_machine_company_code,priority:1;uniqueIndex:ux_punch_machine_company_no,priority:1;index" json:"companyId"`
	DeviceCode           string     `gorm:"type:nvarchar(64);column:DeviceCode;uniqueIndex:ux_punch_machine_company_code,priority:2;index" json:"deviceCode"`
	DeviceName           string     `gorm:"type:nvarchar(128);column:DeviceName" json:"deviceName"`
	MachineNo            int        `gorm:"column:MachineNo;uniqueIndex:ux_punch_machine_company_no,priority:2;index" json:"machineNo"`
	IPAddress            string     `gorm:"type:nvarchar(64);column:IpAddress" json:"ipAddress"`
	Port                 int        `gorm:"column:Port" json:"port"`
	UseTCP               bool       `gorm:"column:UseTcp" json:"useTcp"`
	ProductName          string     `gorm:"type:nvarchar(128);column:ProductName" json:"productName,omitempty"`
	SerialNumber         string     `gorm:"type:nvarchar(128);column:SerialNumber" json:"serialNumber,omitempty"`
	Password             *int       `gorm:"column:Password" json:"password,omitempty"`
	IsActive             bool       `gorm:"column:IsActive;index" json:"isActive"`
	LastConnectionStatus string     `gorm:"type:nvarchar(32);column:LastConnectionStatus;index" json:"lastConnectionStatus"`
	LastError            *string    `gorm:"type:nvarchar(max);column:LastError" json:"lastError,omitempty"`
	LastConnectedAt      *time.Time `gorm:"column:LastConnectedAt" json:"lastConnectedAt,omitempty"`
	LastSyncedAt         *time.Time `gorm:"column:LastSyncedAt" json:"lastSyncedAt,omitempty"`
	LastSyncRecordCount  int        `gorm:"column:LastSyncRecordCount" json:"lastSyncRecordCount"`
	CreatedAt            time.Time  `gorm:"column:CreatedAt" json:"createdAt"`
	UpdatedAt            time.Time  `gorm:"column:UpdatedAt" json:"updatedAt"`
}

func (PunchMachine) TableName() string { return "PunchMachines" }

func (m PunchMachine) DeviceID() string {
	if code := strings.TrimSpace(m.DeviceCode); code != "" {
		return code
	}
	if m.MachineNo > 0 {
		return strconv.Itoa(m.MachineNo)
	}
	return m.SerialNumber
}
