package dto

import "github.com/google/uuid"

type RowError struct {
	Row     int    `json:"row"`
	Column  string `json:"column,omitempty"`
	Message string `json:"message"`
}

type ImportPreviewResult struct {
	SessionID       uuid.UUID  `json:"sessionId"`
	TotalRows       int        `json:"totalRows"`
	ValidRows       int        `json:"validRows"`
	InvalidRows     int        `json:"invalidRows"`
	Errors          []RowError `json:"errors,omitempty"`
	ErrorsTruncated bool       `json:"errorsTruncated"`
	SampleValid     []any      `json:"sampleValid,omitempty"`
}

type ConfirmImportRequest struct {
	SessionID uuid.UUID `json:"sessionId" binding:"required"`
}

type ImportJobDTO struct {
	ID                 uuid.UUID `json:"id"`
	CompanyID          uuid.UUID `json:"companyId"`
	ModuleName         string    `json:"moduleName"`
	Status             string    `json:"status"`
	TotalRows          int       `json:"totalRows"`
	SuccessRows        int       `json:"successRows"`
	FailedRows         int       `json:"failedRows"`
	CreatedRows        int       `json:"createdRows,omitempty"`
	UpdatedRows        int       `json:"updatedRows,omitempty"`
	ErrorFilePath      string    `json:"errorFilePath,omitempty"`
	ProgressPercentage int       `json:"progressPercentage"`
	Remarks            string    `json:"remarks,omitempty"`
	CreatedAt          string    `json:"createdAt"`
}

type ExportJobDTO struct {
	ID         uuid.UUID `json:"id"`
	ModuleName string    `json:"moduleName"`
	Format     string    `json:"format"`
	Status     string    `json:"status"`
	FilePath   string    `json:"filePath,omitempty"`
	CreatedAt  string    `json:"createdAt"`
}

type CompanyOrganogramImportResult struct {
	TotalRows           int        `json:"totalRows"`
	SuccessRows         int        `json:"successRows"`
	FailedRows          int        `json:"failedRows"`
	CompaniesCreated    int        `json:"companiesCreated"`
	DepartmentsCreated  int        `json:"departmentsCreated"`
	DepartmentsUpdated  int        `json:"departmentsUpdated"`
	SectionsCreated     int        `json:"sectionsCreated"`
	SectionsUpdated     int        `json:"sectionsUpdated"`
	DesignationsCreated int        `json:"designationsCreated"`
	DesignationsUpdated int        `json:"designationsUpdated"`
	LinesCreated        int        `json:"linesCreated"`
	LinesUpdated        int        `json:"linesUpdated"`
	Errors              []RowError `json:"errors,omitempty"`
}

type AddressImportResult struct {
	TotalRows          int        `json:"totalRows"`
	SuccessRows        int        `json:"successRows"`
	FailedRows         int        `json:"failedRows"`
	CountriesCreated   int        `json:"countriesCreated"`
	CountriesUpdated   int        `json:"countriesUpdated"`
	DivisionsCreated   int        `json:"divisionsCreated"`
	DivisionsUpdated   int        `json:"divisionsUpdated"`
	DistrictsCreated   int        `json:"districtsCreated"`
	DistrictsUpdated   int        `json:"districtsUpdated"`
	ThanasCreated      int        `json:"thanasCreated"`
	ThanasUpdated      int        `json:"thanasUpdated"`
	PostOfficesCreated int        `json:"postOfficesCreated"`
	PostOfficesUpdated int        `json:"postOfficesUpdated"`
	Errors             []RowError `json:"errors,omitempty"`
}
