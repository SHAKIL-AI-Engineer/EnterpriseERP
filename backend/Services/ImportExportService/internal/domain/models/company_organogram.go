package models

import "time"

type CompanyMaster struct {
	ID            string     `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	CompanyNameEn string     `gorm:"column:CompanyNameEn;size:200"`
	CompanyNameBn *string    `gorm:"column:CompanyNameBn;size:200"`
	Status        string     `gorm:"column:Status;size:20"`
	CreatedAt     time.Time  `gorm:"column:CreatedAt"`
	UpdatedAt     *time.Time `gorm:"column:UpdatedAt"`
}

func (CompanyMaster) TableName() string { return "Companies" }

type CompanyDepartment struct {
	ID        string     `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	CompanyID string     `gorm:"column:CompanyId;type:uniqueidentifier;index"`
	NameEn    string     `gorm:"column:NameEn;size:100"`
	NameBn    string     `gorm:"column:NameBn;size:100"`
	IsActive  bool       `gorm:"column:IsActive"`
	CreatedAt time.Time  `gorm:"column:CreatedAt"`
	UpdatedAt *time.Time `gorm:"column:UpdatedAt"`
}

func (CompanyDepartment) TableName() string { return "Departments" }

type CompanySection struct {
	ID           string     `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	DepartmentID string     `gorm:"column:DepartmentId;type:uniqueidentifier;index"`
	NameEn       string     `gorm:"column:NameEn;size:100"`
	NameBn       string     `gorm:"column:NameBn;size:100"`
	IsActive     bool       `gorm:"column:IsActive"`
	CreatedAt    time.Time  `gorm:"column:CreatedAt"`
	UpdatedAt    *time.Time `gorm:"column:UpdatedAt"`
}

func (CompanySection) TableName() string { return "Sections" }

type CompanyDesignation struct {
	ID        string     `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	SectionID string     `gorm:"column:SectionId;type:uniqueidentifier;index"`
	NameEn    string     `gorm:"column:NameEn;size:100"`
	NameBn    string     `gorm:"column:NameBn;size:100"`
	IsActive  bool       `gorm:"column:IsActive"`
	CreatedAt time.Time  `gorm:"column:CreatedAt"`
	UpdatedAt *time.Time `gorm:"column:UpdatedAt"`
}

func (CompanyDesignation) TableName() string { return "Designations" }

type CompanyLine struct {
	ID        string     `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	SectionID string     `gorm:"column:SectionId;type:uniqueidentifier;index"`
	NameEn    string     `gorm:"column:NameEn;size:100"`
	NameBn    string     `gorm:"column:NameBn;size:100"`
	IsActive  bool       `gorm:"column:IsActive"`
	CreatedAt time.Time  `gorm:"column:CreatedAt"`
	UpdatedAt *time.Time `gorm:"column:UpdatedAt"`
}

func (CompanyLine) TableName() string { return "Lines" }
