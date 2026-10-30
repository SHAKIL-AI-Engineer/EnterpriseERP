package handlers

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/enterprise-erp/punchdata/internal/collector"
	"github.com/enterprise-erp/punchdata/internal/events"
	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
	"github.com/gin-gonic/gin"
)

// LocalCollectHandler exposes read-only punch import from the local ZKTeco Access MDB.
type LocalCollectHandler struct {
	repo      *repository.Repository
	mdbPath   string
	publisher events.Publisher
	logger    *slog.Logger
	opts      collector.LocalOptions

	mu  sync.Mutex
	col *collector.LocalService
}

func NewLocalCollectHandler(cfg LocalCollectHandlerConfig) *LocalCollectHandler {
	return &LocalCollectHandler{
		repo:      cfg.Repo,
		mdbPath:   cfg.MdbPath,
		publisher: cfg.Publisher,
		logger:    cfg.Logger,
		opts:      cfg.Options,
	}
}

type localCollectBody struct {
	CompanyID    int    `json:"companyId"`
	From         string `json:"from,omitempty"`
	To           string `json:"to,omitempty"`
	BatchSize    int    `json:"batchSize,omitempty"`
	UseWatermark bool   `json:"useWatermark,omitempty"`
}

func decodeLocalCollectBody(r io.Reader) (localCollectBody, error) {
	var body localCollectBody
	if err := json.NewDecoder(r).Decode(&body); err != nil {
		return body, err
	}
	return body, nil
}

type localCollectStatusResponse struct {
	Configured bool   `json:"configured"`
	Connected  bool   `json:"connected"`
	Message    string `json:"message,omitempty"`
	ReadOnly   bool   `json:"readOnly"`
}

// Status godoc
// @Summary      Local collect configuration status
// @Description  Reports whether LocalZktecoMdbPath is configured and whether the local ZKTeco MDB file is readable (read-only ping).
// @Tags         local-collect
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  response.ApiResponse[localCollectStatusResponse]
// @Router       /api/v1/punch-data/local/collect/status [get]
func (h *LocalCollectHandler) Status(c *gin.Context) {
	out := localCollectStatusResponse{ReadOnly: true, Configured: h.configured()}
	if !out.Configured {
		out.Message = "Set ConnectionStrings.LocalZktecoMdbPath and restart PunchDataService."
		response.OK(c, out)
		return
	}
	col, err := h.ensureCollector()
	if err != nil {
		out.Message = err.Error()
		response.OK(c, out)
		return
	}
	if err := col.Ping(c.Request.Context()); err != nil {
		out.Message = err.Error()
		response.OK(c, out)
		return
	}
	out.Connected = true
	response.OK(c, out)
}

// Collect godoc
// @Summary      Collect punches from the local ZKTeco Access MDB
// @Description  Read-only SELECT from the local att2000.mdb CHECKINOUT joined to USERINFO; maps BADGENUMBER to PunchRecords.EmployeeCode (ERP EmployeeCode). Pages through the full from/to window with deduplication. Does not modify the MDB. Omit from/to to import the last 62 days (configurable).
// @Tags         local-collect
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body  localCollectBody  true  "Collect window"
// @Success      201   {object}  response.ApiResponse[collector.LocalCollectResult]
// @Failure      400   {object}  response.ApiResponse[any]
// @Failure      401   {object}  response.ApiResponse[any]
// @Failure      502   {object}  response.ApiResponse[any]
// @Failure      503   {object}  response.ApiResponse[any]
// @Router       /api/v1/punch-data/local/collect [post]
func (h *LocalCollectHandler) Collect(c *gin.Context) {
	if !h.requireConfigured(c) {
		return
	}
	col, err := h.ensureCollector()
	if err != nil {
		response.Fail(c, http.StatusBadGateway, response.Err("LOCAL_COLLECT_FAILED", err.Error()))
		return
	}
	body, err := decodeLocalCollectBody(c.Request.Body)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_BODY", err.Error()))
		return
	}
	companyID, ok := middleware.ResolveCompanyID(c, body.CompanyID)
	if !ok {
		return
	}
	body.CompanyID = companyID

	from, to, err := parseLocalCollectRange(body.From, body.To)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_RANGE", err.Error()))
		return
	}

	result, err := col.Collect(c.Request.Context(), collector.LocalCollectRequest{
		CompanyID:    body.CompanyID,
		From:         from,
		To:           to,
		BatchSize:    body.BatchSize,
		UseWatermark: body.UseWatermark,
	})
	if err != nil {
		response.Fail(c, http.StatusBadGateway, response.Err("LOCAL_COLLECT_FAILED", err.Error()))
		return
	}
	response.Created(c, result)
}

type localCollectPreviewResponse struct {
	From          time.Time `json:"from"`
	To            time.Time `json:"to"`
	LocalRows     int64     `json:"localRows"`
	UnmappedLocal int64     `json:"unmappedLocal"`
	ReadOnly      bool      `json:"readOnly"`
}

// Preview godoc
// @Summary      Preview local MDB punch row count
// @Description  Counts mappable rows (CHECKINOUT with USERINFO badge) and unmapped rows in the time window without importing. Defaults to the last 24 hours when from/to are omitted.
// @Tags         local-collect
// @Produce      json
// @Security     BearerAuth
// @Param        from  query  string  false  "RFC3339 start (default: now - 24h)"
// @Param        to    query  string  false  "RFC3339 end (default: now)"
// @Success      200   {object}  response.ApiResponse[localCollectPreviewResponse]
// @Failure      401   {object}  response.ApiResponse[any]
// @Failure      502   {object}  response.ApiResponse[any]
// @Failure      503   {object}  response.ApiResponse[any]
// @Router       /api/v1/punch-data/local/collect/preview [get]
func (h *LocalCollectHandler) Preview(c *gin.Context) {
	if !h.requireConfigured(c) {
		return
	}
	col, err := h.ensureCollector()
	if err != nil {
		response.Fail(c, http.StatusBadGateway, response.Err("LOCAL_PREVIEW_FAILED", err.Error()))
		return
	}
	to := timeutil.WallClock(timeutil.Now())
	if v := c.Query("to"); v != "" {
		if t, err := timeutil.ParseRangeTime(v); err == nil {
			to = t
		}
	}
	from := to.Add(-24 * time.Hour)
	if v := c.Query("from"); v != "" {
		if t, err := timeutil.ParseRangeTime(v); err == nil {
			from = t
		}
	}
	mapped, unmapped, err := col.PreviewDetail(c.Request.Context(), from, to)
	if err != nil {
		response.Fail(c, http.StatusBadGateway, response.Err("LOCAL_PREVIEW_FAILED", err.Error()))
		return
	}
	response.OK(c, localCollectPreviewResponse{
		From: from, To: to, LocalRows: mapped, UnmappedLocal: unmapped, ReadOnly: true,
	})
}

// ListHistories godoc
// @Summary      List local collect runs
// @Description  Paginated history of read-only imports from the local ZKTeco MDB file.
// @Tags         local-collect
// @Produce      json
// @Security     BearerAuth
// @Param        companyId  query  int  false  "Company filter"
// @Param        page       query  int  false  "Page (1-based)"  default(1)
// @Param        pageSize   query  int  false  "Page size (max 100)"  default(20)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.LocalCollectHistory]]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      503  {object}  response.ApiResponse[any]
// @Router       /api/v1/punch-data/local/collect/histories [get]
func (h *LocalCollectHandler) ListHistories(c *gin.Context) {
	if h.repo == nil {
		response.Fail(c, http.StatusServiceUnavailable, response.Err("LOCAL_COLLECT_DISABLED", "Local collect history is unavailable."))
		return
	}
	companyID := 0
	if id, ok := middleware.CompanyID(c); ok {
		companyID = id
	}
	page, pageSize := 1, 20
	if v := c.Query("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			page = n
		}
	}
	if v := c.Query("pageSize"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			pageSize = n
		}
	}
	items, total, err := h.repo.ListLocalCollectHistories(c.Request.Context(), companyID, page, pageSize)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("HISTORY_LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.LocalCollectHistory]{
		Items: items, Page: page, PageSize: pageSize, TotalCount: total,
	})
}

func (h *LocalCollectHandler) requireConfigured(c *gin.Context) bool {
	if h.configured() {
		return true
	}
	response.Fail(c, http.StatusServiceUnavailable, response.Err("LOCAL_COLLECT_DISABLED", "Local ZKTeco collect is not configured (set ConnectionStrings.LocalZktecoMdbPath in backend/Configuration/connectionstrings.json or PUNCHDATA_LOCAL_MDB_PATH)."))
	return false
}

func parseLocalCollectRange(fromRaw, toRaw string) (from, to *time.Time, err error) {
	if strings.TrimSpace(fromRaw) != "" {
		t, parseErr := timeutil.ParseRangeTime(fromRaw)
		if parseErr != nil {
			return nil, nil, parseErr
		}
		from = &t
	}
	if strings.TrimSpace(toRaw) != "" {
		t, parseErr := timeutil.ParseRangeTime(toRaw)
		if parseErr != nil {
			return nil, nil, parseErr
		}
		to = &t
	}
	return from, to, nil
}