package handlers

import (
	"net/http"
	"strconv"

	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ImportsHandler struct{ repo *repository.Repository }

func NewImportsHandler(repo *repository.Repository) *ImportsHandler {
	return &ImportsHandler{repo: repo}
}

// ListBatches godoc
// @Summary      List import batch history
// @Tags         imports
// @Produce      json
// @Param        companyId  query  int     false  "Filter by company id (from query or JWT)"
// @Param        status     query  string  false  "Filter by batch status"
// @Param        page       query  int     false  "Page (1-based)"  default(1)
// @Param        pageSize   query  int     false  "Page size"  default(50)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.PunchImportBatch]]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/imports [get]
func (h *ImportsHandler) ListBatches(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("pageSize", "50"))
	filter := repository.ImportBatchFilter{
		Status:   c.Query("status"),
		Page:     page,
		PageSize: size,
	}
	if companyID, ok := middleware.CompanyID(c); ok {
		filter.CompanyID = &companyID
	}
	items, total, err := h.repo.ListImportBatches(c.Request.Context(), filter)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("IMPORT_LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.PunchImportBatch]{
		Items: items, Page: page, PageSize: size, TotalCount: total,
	})
}

// ListErrors godoc
// @Summary      List row errors for an import batch
// @Tags         imports
// @Produce      json
// @Param        id        path   string  true   "Import batch id (uuid)"
// @Param        page      query  int     false  "Page (1-based)"  default(1)
// @Param        pageSize  query  int     false  "Page size"  default(100)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.PunchImportError]]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      404  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/imports/{id}/errors [get]
func (h *ImportsHandler) ListErrors(c *gin.Context) {
	batchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_ID", "Invalid import batch id."))
		return
	}
	batch, err := h.repo.GetImportBatch(c.Request.Context(), batchID)
	if err != nil {
		response.Fail(c, http.StatusNotFound, response.Err("IMPORT_NOT_FOUND", err.Error()))
		return
	}
	if !middleware.EnsureResourceCompany(c, batch.CompanyID) {
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("pageSize", "100"))
	items, total, err := h.repo.ListImportErrors(c.Request.Context(), batchID, page, size)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("IMPORT_ERRORS_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.PunchImportError]{
		Items: items, Page: page, PageSize: size, TotalCount: total,
	})
}
