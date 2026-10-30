package handlers

import (
	"net/http"

	"github.com/enterprise-erp/importexport/internal/middleware"
	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/enterprise-erp/importexport/internal/services/importsvc"
	"github.com/gin-gonic/gin"
)

type ExportHandler struct {
	Svc *importsvc.Service
}

// ExportRequest body for export endpoint.
type ExportRequest struct {
	Format  string         `json:"format" example:"Excel"`
	Filters map[string]any `json:"filters"`
}

// Create godoc
// @Summary      Export data
// @Description  Generate Excel or CSV export for the module. PDF is not supported.
// @Tags         export
// @Accept       json
// @Produce      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Security     BearerAuth
// @Param        module  path      string         true  "Module name"
// @Param        body    body      ExportRequest  false "Export options"
// @Success      200     {file}    binary
// @Failure      400     {object}  APIResponseError
// @Failure      401     {object}  APIResponseError
// @Router       /api/v1/import-export/export/{module} [post]
func (h *ExportHandler) Create(c *gin.Context) {
	companyID, ok := middleware.CompanyID(c)
	if !ok {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("COMPANY", "companyId claim required"))
		return
	}
	var req ExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Format = "Excel"
	}
	module := c.Param("module")
	job, fullPath, err := h.Svc.Export(companyID, middleware.UserID(c), module, req.Format, req.Filters, middleware.BearerToken(c))
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("EXPORT", err.Error()))
		return
	}
	name := job.ID.String() + ".xlsx"
	if job.Format == "CSV" {
		name = job.ID.String() + ".csv"
	}
	c.Header("Content-Disposition", "attachment; filename="+name)
	c.File(fullPath)
}
