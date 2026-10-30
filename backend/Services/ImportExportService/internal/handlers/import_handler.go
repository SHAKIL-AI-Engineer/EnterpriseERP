package handlers

import (
	"net/http"
	"path/filepath"

	"github.com/enterprise-erp/importexport/internal/dto"
	"github.com/enterprise-erp/importexport/internal/middleware"
	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/enterprise-erp/importexport/internal/services/importsvc"
	"github.com/enterprise-erp/importexport/internal/storage"
	"github.com/gin-gonic/gin"
)

type ImportHandler struct {
	Svc   *importsvc.Service
	Store storage.LocalStorage
}

const maxImportUploadBytes = 25 << 20

// Preview godoc
// @Summary      Preview import file
// @Description  Upload an Excel file, validate rows, and return a preview session. Modules: employee, attendance, payroll, shift, leave.
// @Tags         import
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        module  path      string  true  "Module name"  Enums(employee, attendance, payroll, shift, leave)
// @Param        file    formData  file    true  "Excel (.xlsx) file"
// @Success      200     {object}  APIResponseImportPreview
// @Failure      400     {object}  APIResponseError
// @Failure      401     {object}  APIResponseError
// @Router       /api/v1/import-export/import/{module}/preview [post]
func (h *ImportHandler) Preview(c *gin.Context) {
	companyID, ok := middleware.CompanyID(c)
	if !ok {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("COMPANY", "companyId claim required"))
		return
	}
	module := c.Param("module")
	file, err := c.FormFile("file")
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("FILE", "file is required"))
		return
	}
	if file.Size <= 0 {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("FILE", "file is empty"))
		return
	}
	if file.Size > maxImportUploadBytes {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("FILE", "file exceeds 25 MB upload limit"))
		return
	}
	if err := storage.ValidateMIME(file.Filename, nil); err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("FILE", err.Error()))
		return
	}
	src, err := file.Open()
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("FILE", err.Error()))
		return
	}
	defer src.Close()
	rel, _, _, err := h.Store.Save("imports", file.Filename, src)
	if err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("STORAGE", err.Error()))
		return
	}
	absPath := filepath.Join(h.Store.Root, rel)
	result, err := h.Svc.Preview(companyID, middleware.UserID(c), module, absPath, file.Filename)
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("IMPORT", err.Error()))
		return
	}
	response.OK(c, result)
}

// Confirm godoc
// @Summary      Confirm import
// @Description  Commit a preview session as an import job (sync or queued for large files).
// @Tags         import
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        module  path      string                   true  "Module name"
// @Param        body    body      dto.ConfirmImportRequest  true  "Preview session id"
// @Success      200     {object}  APIResponseImportJob
// @Failure      400     {object}  APIResponseError
// @Failure      401     {object}  APIResponseError
// @Router       /api/v1/import-export/import/{module}/confirm [post]
func (h *ImportHandler) Confirm(c *gin.Context) {
	companyID, ok := middleware.CompanyID(c)
	if !ok {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("COMPANY", "companyId claim required"))
		return
	}
	var req dto.ConfirmImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("VALIDATION", err.Error()))
		return
	}
	job, err := h.Svc.Confirm(c.Request.Context(), companyID, middleware.UserID(c), req.SessionID, middleware.BearerToken(c))
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("IMPORT", err.Error()))
		return
	}
	response.OK(c, job)
}
