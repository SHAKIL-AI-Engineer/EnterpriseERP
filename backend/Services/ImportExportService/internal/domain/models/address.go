package models

type Country struct {
	ID       string `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	NameEn   string `gorm:"column:NameEn;size:100"`
	NameBn   string `gorm:"column:NameBn;size:100"`
	Code     string `gorm:"column:Code;size:10"`
	IsActive bool   `gorm:"column:IsActive"`
}

func (Country) TableName() string { return "Countries" }

type Division struct {
	ID        string `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	CountryID string `gorm:"column:CountryId;type:uniqueidentifier;index"`
	NameEn    string `gorm:"column:NameEn;size:100"`
	NameBn    string `gorm:"column:NameBn;size:100"`
	IsActive  bool   `gorm:"column:IsActive"`
}

func (Division) TableName() string { return "Divisions" }

type District struct {
	ID         string `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	DivisionID string `gorm:"column:DivisionId;type:uniqueidentifier;index"`
	NameEn     string `gorm:"column:NameEn;size:100"`
	NameBn     string `gorm:"column:NameBn;size:100"`
	IsActive   bool   `gorm:"column:IsActive"`
}

func (District) TableName() string { return "Districts" }

type Upazila struct {
	ID         string `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	DistrictID string `gorm:"column:DistrictId;type:uniqueidentifier;index"`
	NameEn     string `gorm:"column:NameEn;size:100"`
	NameBn     string `gorm:"column:NameBn;size:100"`
	IsActive   bool   `gorm:"column:IsActive"`
}

func (Upazila) TableName() string { return "Upazilas" }

type PostOffice struct {
	ID         string `gorm:"column:Id;type:uniqueidentifier;primaryKey"`
	UpazilaID  string `gorm:"column:UpazilaId;type:uniqueidentifier;index"`
	NameEn     string `gorm:"column:NameEn;size:100"`
	NameBn     string `gorm:"column:NameBn;size:100"`
	PostalCode string `gorm:"column:PostalCode;size:20"`
	IsActive   bool   `gorm:"column:IsActive"`
}

func (PostOffice) TableName() string { return "PostOffices" }
