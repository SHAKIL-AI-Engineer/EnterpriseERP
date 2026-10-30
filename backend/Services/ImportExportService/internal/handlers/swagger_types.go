package handlers

import (
	"github.com/enterprise-erp/importexport/internal/dto"
	"github.com/enterprise-erp/importexport/internal/response"
)

// Swagger response wrappers (API envelope).

type APIResponseHealth struct {
	Success bool                   `json:"success" example:"true"`
	TraceID string                 `json:"traceId,omitempty"`
	Data    map[string]string      `json:"data"`
	Errors  []response.ErrorDetail `json:"errors,omitempty"`
}

type APIResponseImportPreview struct {
	Success bool                    `json:"success" example:"true"`
	TraceID string                  `json:"traceId,omitempty"`
	Data    dto.ImportPreviewResult `json:"data"`
	Errors  []response.ErrorDetail  `json:"errors,omitempty"`
}

type APIResponseImportJob struct {
	Success bool                   `json:"success" example:"true"`
	TraceID string                 `json:"traceId,omitempty"`
	Data    dto.ImportJobDTO       `json:"data"`
	Errors  []response.ErrorDetail `json:"errors,omitempty"`
}

type APIResponseImportJobList struct {
	Success bool                   `json:"success" example:"true"`
	TraceID string                 `json:"traceId,omitempty"`
	Data    []dto.ImportJobDTO     `json:"data"`
	Errors  []response.ErrorDetail `json:"errors,omitempty"`
}

type APIResponseExportJobList struct {
	Success bool                   `json:"success" example:"true"`
	TraceID string                 `json:"traceId,omitempty"`
	Data    []dto.ExportJobDTO     `json:"data"`
	Errors  []response.ErrorDetail `json:"errors,omitempty"`
}

type APIResponseCompanyOrganogramImport struct {
	Success bool                              `json:"success" example:"true"`
	TraceID string                            `json:"traceId,omitempty"`
	Data    dto.CompanyOrganogramImportResult `json:"data"`
	Errors  []response.ErrorDetail            `json:"errors,omitempty"`
}

type APIResponseAddressImport struct {
	Success bool                    `json:"success" example:"true"`
	TraceID string                  `json:"traceId,omitempty"`
	Data    dto.AddressImportResult `json:"data"`
	Errors  []response.ErrorDetail  `json:"errors,omitempty"`
}

type APIResponseError struct {
	Success bool                   `json:"success" example:"false"`
	TraceID string                 `json:"traceId,omitempty"`
	Errors  []response.ErrorDetail `json:"errors"`
}
