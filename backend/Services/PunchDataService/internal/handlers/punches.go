package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/processor"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PunchesHandler exposes raw punch log endpoints (not attendance calculation).
type PunchesHandler struct {
	repo *repository.Repository
	proc *processor.Service
}

func NewPunchesHandler(repo *repository.Repository, proc *processor.Service) *PunchesHandler {
	return &PunchesHandler{repo: repo, proc: proc}
}

type manualPunchRequest struct {
	CompanyID   int    `json:"companyId"`
	PunchNumber int    `json:"punchNumber"`
	DeviceID    string `json:"deviceId,omitempty"`
	PunchTime   string `json:"punchTime,omitempty"`
	Source      string `json:"source,omitempty"`
}

type manualPunchResponse struct {
	Record     *models.PunchRecord `json:"record,omitempty"`
	Duplicate  bool                `json:"duplicate"`
}

// Manual godoc
// @Summary      Create a manual raw punch log
// @Description  Does not calculate attendance (raw log collection only). Duplicate punches are ignored.
// @Tags         punches
// @Accept       json
// @Produce      json
// @Param        body  body  manualPunchRequest  true  "Manual punch"
// @Success      201  {object}  response.ApiResponse[manualPunchResponse]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/punches/manual [post]
func (h *PunchesHandler) Manual(c *gin.Context) {
	var req manualPunchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("PUNCH_INVALID", err.Error()))
		return
	}
	var punchTime time.Time
	if req.PunchTime != "" {
		t, err := parseTimeFlexible(req.PunchTime)
		if err != nil {
			response.Fail(c, http.StatusBadRequest, response.Err("PUNCH_TIME_INVALID", "Invalid punchTime."))
			return
		}
		punchTime = t
	}
	companyID, ok := middleware.ResolveCompanyID(c, req.CompanyID)
	if !ok {
		return
	}
	rec, duplicate, err := h.proc.CreateManualPunch(c.Request.Context(), processor.ManualPunchRequest{
		CompanyID:   companyID,
		PunchNumber: req.PunchNumber,
		DeviceID:    req.DeviceID,
		PunchTime:   punchTime,
		Source:      req.Source,
	})
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("PUNCH_CREATE_FAILED", err.Error()))
		return
	}
	response.Created(c, manualPunchResponse{Record: rec, Duplicate: duplicate})
}

// List godoc
// @Summary      List raw punch logs
// @Description  Paginated punch records. Pass companyId in query or JWT when scoped.
// @Tags         punches
// @Produce      json
// @Param        companyId     query  int     false  "Filter by company id"
// @Param        punchNumber   query  int     false  "Filter by punch number (device badge)"
// @Param        deviceId      query  string  false  "Filter by device id"
// @Param        logFileId     query  string  false  "Filter by source log file id (uuid)"
// @Param        from          query  string  false  "Punch time from (RFC3339 or local)"
// @Param        to            query  string  false  "Punch time to (RFC3339 or local)"
// @Param        page          query  int     false  "Page (1-based)"  default(1)
// @Param        pageSize      query  int     false  "Page size (max 500)"  default(100)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.PunchRecord]]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/punches [get]
func (h *PunchesHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("pageSize", "100"))

	f := repository.PunchFilter{
		DeviceID: c.Query("deviceId"),
		Page:     page,
		PageSize: size,
	}
	if v := c.Query("punchNumber"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			f.PunchNumber = &n
		}
	}
	if companyID, ok := middleware.CompanyID(c); ok {
		f.CompanyID = &companyID
	}
	if v := c.Query("logFileId"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			f.LogFileID = &id
		}
	}
	if v := c.Query("from"); v != "" {
		if t, err := parseTimeFlexible(v); err == nil {
			f.From = &t
		}
	}
	if v := c.Query("to"); v != "" {
		if t, err := parseTimeFlexible(v); err == nil {
			f.To = &t
		}
	}

	items, total, err := h.repo.ListPunches(c.Request.Context(), f)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.PunchRecord]{
		Items: items, Page: page, PageSize: size, TotalCount: total,
	})
}

// ListForLog godoc
// @Summary      List punch records for a log file
// @Tags         logs
// @Produce      json
// @Param        id        path   string  true   "Log file id (uuid)"
// @Param        page      query  int     false  "Page (1-based)"  default(1)
// @Param        pageSize  query  int     false  "Page size"  default(200)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.PunchRecord]]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      404  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/logs/{id}/records [get]
func (h *PunchesHandler) ListForLog(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_ID", "Invalid log id."))
		return
	}
	lf, err := h.repo.GetLogFile(c.Request.Context(), id)
	if err != nil {
		response.Fail(c, http.StatusNotFound, response.Err("LOG_NOT_FOUND", err.Error()))
		return
	}
	if !middleware.EnsureResourceCompany(c, lf.CompanyID) {
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("pageSize", "200"))
	filter := repository.PunchFilter{LogFileID: &id, Page: page, PageSize: size}
	if companyID, ok := middleware.CompanyID(c); ok {
		filter.CompanyID = &companyID
	}
	items, total, err := h.repo.ListPunches(c.Request.Context(), filter)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.PunchRecord]{
		Items: items, Page: page, PageSize: size, TotalCount: total,
	})
}

func parseTimeFlexible(s string) (time.Time, error) {
	return timeutil.ParsePunchTime(s)
}
