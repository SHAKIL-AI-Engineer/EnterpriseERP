package handlers

import (
	"net/http"
	"path/filepath"

	"github.com/enterprise-erp/importexport/internal/middleware"
	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/enterprise-erp/importexport/internal/services/importsvc"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type JobsHandler struct {
	Svc *importsvc.Service
}

// ListImportJobs godoc
// @Summary      List import jobs
// @Tags         import-jobs
// @Produce      json
// @Security     BearerAuth
// @Param        module  query     string  false  "Filter by module"
// @Success      200     {object}  APIResponseImportJobList
// @Failure      401     {object}  APIResponseError
// @Router       /api/v1/import-export/import-jobs [get]
func (h *JobsHandler) ListImportJobs(c *gin.Context) {
	companyID, ok := middleware.CompanyID(c)
	if !ok {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("COMPANY", "companyId claim required"))
		return
	}
	list, err := h.Svc.ListImportJobs(companyID, c.Query("module"), 50)
	if err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("DB", err.Error()))
		return
	}
	response.OK(c, list)
}

// GetImportJob godoc
// @Summary      Get import job
// @Tags         import-jobs
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Job id (UUID)"
// @Success      200  {object}  APIResponseImportJob
// @Failure      404  {object}  APIResponseError
// @Router       /api/v1/import-export/import-jobs/{id} [get]
func (h *JobsHandler) GetImportJob(c *gin.Context) {
	companyID, ok := middleware.CompanyID(c)
	if !ok {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("COMPANY", "companyId claim required"))
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("ID", "invalid id"))
		return
	}
	job, err := h.Svc.GetImportJob(companyID, id)
	if err != nil {
		response.FailWithStatus(c, http.StatusNotFound, response.Err("NOT_FOUND", "import job not found"))
		return
	}
	response.OK(c, job)
}

// DownloadImportErrorFile godoc
// @Summary      Download import error file
// @Tags         import-jobs
// @Produce      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Security     BearerAuth
// @Param        id   path  string  true  "Job id (UUID)"
// @Success      200  {file}  binary
// @Failure      404  {object}  APIResponseError
// @Router       /api/v1/import-export/import-jobs/{id}/error-file [get]
func (h *JobsHandler) DownloadImportErrorFile(c *gin.Context) {
	companyID, ok := middleware.CompanyID(c)
	if !ok {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("COMPANY", "companyId claim required"))
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("ID", "invalid id"))
		return
	}
	path, err := h.Svc.ErrorFilePath(companyID, id)
	if err != nil {
		response.FailWithStatus(c, http.StatusNotFound, response.Err("NOT_FOUND", err.Error()))
		return
	}
	c.File(path)
}

// ListExportJobs godoc
// @Summary      List export jobs
// @Tags         export-jobs
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  APIResponseExportJobList
// @Failure      401  {object}  APIResponseError
// @Router       /api/v1/import-export/export-jobs [get]
func (h *JobsHandler) ListExportJobs(c *gin.Context) {
	companyID, ok := middleware.CompanyID(c)
	if !ok {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("COMPANY", "companyId claim required"))
		return
	}
	list, err := h.Svc.ListExportJobs(companyID, 50)
	if err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("DB", err.Error()))
		return
	}
	response.OK(c, list)
}

// DownloadExportJob godoc
// @Summary      Download export file
// @Tags         export-jobs
// @Produce      application/octet-stream
// @Security     BearerAuth
// @Param        id   path  string  true  "Job id (UUID)"
// @Success      200  {file}  binary
// @Failure      404  {object}  APIResponseError
// @Router       /api/v1/import-export/export-jobs/{id}/download [get]
func (h *JobsHandler) DownloadExportJob(c *gin.Context) {
	companyID, ok := middleware.CompanyID(c)
	if !ok {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("COMPANY", "companyId claim required"))
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("ID", "invalid id"))
		return
	}
	job, err := h.Svc.GetExportJob(companyID, id)
	if err != nil {
		response.FailWithStatus(c, http.StatusNotFound, response.Err("NOT_FOUND", "export job not found"))
		return
	}
	if job.FilePath == "" {
		response.FailWithStatus(c, http.StatusNotFound, response.Err("NOT_FOUND", "file not ready"))
		return
	}
	c.FileAttachment(filepath.Join(h.Svc.Store.Root, job.FilePath), job.FileName)
}
