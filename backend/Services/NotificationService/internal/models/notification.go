package models

import (
	"time"

	"github.com/google/uuid"
)

// Notification types
const (
	TypeEmail = "Email"
	TypeSMS   = "SMS"
	TypeInApp = "InApp"
)

// Notification statuses
const (
	StatusPending = "Pending"
	StatusSent    = "Sent"
	StatusFailed  = "Failed"
	StatusRead    = "Read"
)

// Notification maps to the existing EF Core Notifications table (PascalCase columns).
type Notification struct {
	ID             uuid.UUID  `gorm:"column:Id;type:uniqueidentifier;primaryKey" json:"id"`
	RecipientId    uuid.UUID  `gorm:"column:RecipientId;type:uniqueidentifier;not null" json:"recipientId"`
	RecipientEmail string     `gorm:"column:RecipientEmail;size:255" json:"recipientEmail"`
	RecipientPhone string     `gorm:"column:RecipientPhone;size:50" json:"recipientPhone"`
	Type           string     `gorm:"column:Type;size:20;not null" json:"type"`
	Subject        string     `gorm:"column:Subject;size:500;not null" json:"subject"`
	Body           string     `gorm:"column:Body;type:nvarchar(max)" json:"body"`
	Status         string     `gorm:"column:Status;size:20;not null" json:"status"`
	SentAt         *time.Time `gorm:"column:SentAt" json:"sentAt"`
	ErrorMessage   *string    `gorm:"column:ErrorMessage;size:1000" json:"errorMessage"`
	CreatedAt      time.Time  `gorm:"column:CreatedAt" json:"createdAt"`
	CreatedBy      *uuid.UUID `gorm:"column:CreatedBy;type:uniqueidentifier" json:"createdBy"`
	UpdatedAt      *time.Time `gorm:"column:UpdatedAt" json:"updatedAt"`
	UpdatedBy      *uuid.UUID `gorm:"column:UpdatedBy;type:uniqueidentifier" json:"updatedBy"`
	IsDeleted      bool       `gorm:"column:IsDeleted" json:"isDeleted"`
	DeletedAt      *time.Time `gorm:"column:DeletedAt" json:"deletedAt"`
	DeletedBy      *uuid.UUID `gorm:"column:DeletedBy;type:uniqueidentifier" json:"deletedBy"`
}

func (Notification) TableName() string { return "Notifications" }

type SendNotificationRequest struct {
	RecipientId    uuid.UUID `json:"recipientId" binding:"required"`
	RecipientEmail string    `json:"recipientEmail"`
	RecipientPhone string    `json:"recipientPhone"`
	Type           string    `json:"type"`
	Subject        string    `json:"subject" binding:"required"`
	Body           string    `json:"body"`
}

type NotificationTemplate struct {
	ID        uuid.UUID  `gorm:"column:Id;type:uniqueidentifier;primaryKey" json:"id"`
	Name      string     `gorm:"column:Name;size:255;not null" json:"name"`
	Type      string     `gorm:"column:Type;size:20;not null" json:"type"`
	Subject   string     `gorm:"column:Subject;size:500;not null" json:"subject"`
	Body      string     `gorm:"column:Body;type:nvarchar(max)" json:"body"`
	IsActive  bool       `gorm:"column:IsActive" json:"isActive"`
	IsDeleted bool       `gorm:"column:IsDeleted" json:"isDeleted"`
	CreatedAt time.Time  `gorm:"column:CreatedAt" json:"createdAt"`
	CreatedBy *uuid.UUID `gorm:"column:CreatedBy;type:uniqueidentifier" json:"createdBy"`
	UpdatedAt *time.Time `gorm:"column:UpdatedAt" json:"updatedAt"`
	UpdatedBy *uuid.UUID `gorm:"column:UpdatedBy;type:uniqueidentifier" json:"updatedBy"`
	DeletedAt *time.Time `gorm:"column:DeletedAt" json:"deletedAt"`
	DeletedBy *uuid.UUID `gorm:"column:DeletedBy;type:uniqueidentifier" json:"deletedBy"`
}

func (NotificationTemplate) TableName() string { return "NotificationTemplates" }
