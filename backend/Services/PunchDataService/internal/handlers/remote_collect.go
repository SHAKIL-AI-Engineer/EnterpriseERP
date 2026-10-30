package handlers

import (
	"database/sql"
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

// RemoteCollectHandler exposes read-only public SQL Server punch import on port 5050.
type RemoteCollectHandler struct {
	repo          *repository.Repository
	remoteConnStr string
	publisher     events.Publisher
	logger        *slog.Logger
	remoteOpts    collector.RemoteOptions

	mu        sync.Mutex
	collector *collector.RemoteService
	remoteSQL *sql.DB
}

// NewRemoteCollectHandler builds a handler that opens the remote DB on first collect/preview.
// If col is non-nil (eager startup connection), it is used immediately.
func NewRemoteCollectHandler(cfg RemoteCollectHandlerConfig, col *collector.RemoteService) *RemoteCollectHandler {
	h := &RemoteCollectHandler{
		repo:          cfg.Repo,
		remoteConnStr: cfg.RemoteConnStr,
		publisher:     cfg.Publisher,
		logger:        cfg.Logger,
		remoteOpts:    cfg.Options,
		collector:     col,
	}
	return h
}

type remoteCollectBody struct {
	CompanyID    int    `json:"companyId"`
	From         string `json:"from,omitempty"`
	To           string `json:"to,omitempty"`
	BatchSize    int    `json:"batchSize,omitempty"`
	UseWatermark bool   `json:"useWatermark,omitempty"`
}

func decodeRemoteCollectBody(r io.Reader) (remoteCollectBody, error) {
	var body remoteCollectBody
	dec := json.NewDecoder(r)
	if err := dec.Decode(&body); err != nil {
		return body, err
	}
	return body, nil
}

func parseRemoteCollectRange(fromRaw, toRaw string) (from, to *time.Time, err error) {
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

func (h *RemoteCollectHandler) requireConfigured(c *gin.Context) bool {
	if h.configured() {
		return true
	}
	response.Fail(c, http.StatusServiceUnavailable, response.Err("REMOTE_COLLECT_DISABLED", "Remote ZKTeco collect is not configured (set ConnectionStrings.RemoteZktecoDb in backend/Configuration/connectionstrings.json or PUNCHDATA_REMOTE_CONNECTIONSTRING)."))
	return false
}

type remoteCollectStatusResponse struct {
	Configured bool   `json:"configured"`
	Connected  bool   `json:"connected"`
	Message    string `json:"message,omitempty"`
	ReadOnly   bool   `json:"readOnly"`
}

// Status godoc
// @Summary      Remote collect configuration status
// @Description  Reports whether RemoteZktecoDb is configured and whether the remote SQL Server is reachable (read-only ping).
// @Tags         remote-collect
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  response.ApiResponse[remoteCollectStatusResponse]
// @Router       /api/v1/punch-data/remote/collect/status [get]
func (h *RemoteCollectHandler) Status(c *gin.Context) {
	out := remoteCollectStatusResponse{ReadOnly: true, Configured: h.configured()}
	if !out.Configured {
		out.Message = "Set ConnectionStrings.RemoteZktecoDb and restart PunchDataService."
		response.OK(c, out)
		return
	}
	if _, err := h.ensureCollector(c.Request.Context()); err != nil {
		out.Message = err.Error()
		response.OK(c, out)
		return
	}
	out.Connected = true
	response.OK(c, out)
}

// Collect godoc
// @Summary      Collect punches from public ZKTeco SQL Server
// @Description  Read-only SELECT from remote CHECKINOUT joined to USERINFO; maps BADGENUMBER to PunchRecords.EmployeeCode (ERP EmployeeCode). Pages through the full from/to window with deduplication. Does not modify the remote database. Omit from/to to import the last 62 days (configurable).
// @Tags         remote-collect
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body  remoteCollectBody  true  "Collect window"
// @Success      201   {object}  response.ApiResponse[collector.RemoteCollectResult]
// @Failure      400   {object}  response.ApiResponse[any]
// @Failure      401   {object}  response.ApiResponse[any]
// @Failure      502   {object}  response.ApiResponse[any]
// @Failure      503   {object}  response.ApiResponse[any]
// @Router       /api/v1/punch-data/remote/collect [post]
func (h *RemoteCollectHandler) Collect(c *gin.Context) {
	if !h.requireConfigured(c) {
		return
	}
	col, err := h.ensureCollector(c.Request.Context())
	if err != nil {
		response.Fail(c, http.StatusBadGateway, response.Err("REMOTE_COLLECT_FAILED", err.Error()))
		return
	}
	body, err := decodeRemoteCollectBody(c.Request.Body)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_BODY", err.Error()))
		return
	}
	companyID, ok := middleware.ResolveCompanyID(c, body.CompanyID)
	if !ok {
		return
	}
	body.CompanyID = companyID

	from, to, err := parseRemoteCollectRange(body.From, body.To)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_RANGE", err.Error()))
		return
	}

	result, err := col.Collect(c.Request.Context(), collector.RemoteCollectRequest{
		CompanyID:    body.CompanyID,
		From:         from,
		To:           to,
		BatchSize:    body.BatchSize,
		UseWatermark: body.UseWatermark,
	})
	if err != nil {
		response.Fail(c, http.StatusBadGateway, response.Err("REMOTE_COLLECT_FAILED", err.Error()))
		return
	}
	response.Created(c, result)
}

// Preview godoc
// @Summary      Preview remote punch row count
// @Description  Counts mappable rows (CHECKINOUT with USERINFO badge) and unmapped rows in the time window without importing. Defaults to the last 24 hours when from/to are omitted.
// @Tags         remote-collect
// @Produce      json
// @Security     BearerAuth
// @Param        from  query  string  false  "RFC3339 start (default: now - 24h)"
// @Param        to    query  string  false  "RFC3339 end (default: now)"
// @Success      200   {object}  response.ApiResponse[remoteCollectPreviewResponse]
// @Failure      401   {object}  response.ApiResponse[any]
// @Failure      502   {object}  response.ApiResponse[any]
// @Failure      503   {object}  response.ApiResponse[any]
// @Router       /api/v1/punch-data/remote/collect/preview [get]
func (h *RemoteCollectHandler) Preview(c *gin.Context) {
	if !h.requireConfigured(c) {
		return
	}
	col, err := h.ensureCollector(c.Request.Context())
	if err != nil {
		response.Fail(c, http.StatusBadGateway, response.Err("REMOTE_PREVIEW_FAILED", err.Error()))
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
		response.Fail(c, http.StatusBadGateway, response.Err("REMOTE_PREVIEW_FAILED", err.Error()))
		return
	}
	response.OK(c, remoteCollectPreviewResponse{
		From: from, To: to, RemoteRows: mapped, UnmappedRemote: unmapped, ReadOnly: true,
	})
}

// ListHistories godoc
// @Summary      List remote collect runs
// @Description  Paginated history of read-only imports from the public ZKTeco database.
// @Tags         remote-collect
// @Produce      json
// @Security     BearerAuth
// @Param        companyId  query  int  false  "Company filter"
// @Param        page       query  int  false  "Page (1-based)"  default(1)
// @Param        pageSize   query  int  false  "Page size (max 100)"  default(20)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.RemoteCollectHistory]]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Failure      503  {object}  response.ApiResponse[any]
// @Router       /api/v1/punch-data/remote/collect/histories [get]
func (h *RemoteCollectHandler) ListHistories(c *gin.Context) {
	if h.repo == nil {
		response.Fail(c, http.StatusServiceUnavailable, response.Err("REMOTE_COLLECT_DISABLED", "Remote collect history is unavailable."))
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
	items, total, err := h.repo.ListCollectHistories(c.Request.Context(), companyID, page, pageSize)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("HISTORY_LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.RemoteCollectHistory]{
		Items: items, Page: page, PageSize: pageSize, TotalCount: total,
	})
}
