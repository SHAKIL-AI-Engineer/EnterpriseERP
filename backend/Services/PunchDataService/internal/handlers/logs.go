package handlers

import (
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/processor"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LogsHandler exposes the file-style ingestion + processing endpoints.
type LogsHandler struct {
	repo        *repository.Repository
	proc        *processor.Service
	maxUploadMB int
}

func NewLogsHandler(repo *repository.Repository, proc *processor.Service, maxUploadMB int) *LogsHandler {
	if maxUploadMB <= 0 {
		maxUploadMB = 32
	}
	return &LogsHandler{repo: repo, proc: proc, maxUploadMB: maxUploadMB}
}

// Upload godoc
// @Summary      Upload a punch log file
// @Description  Accepts a multipart upload of a CSV or JSON punch payload. The file is persisted and (unless `autoProcess=false`) immediately parsed into normalised punch records.
// @Tags         logs
// @Accept       mpfd
// @Produce      json
// @Param        file         formData  file    true   "Punch log file (CSV or JSON)"
// @Param        companyId    formData  int     false  "Company id to associate with the payload"
// @Param        deviceId     formData  string  false  "Source device identifier"
// @Param        autoProcess  formData  string  false  "Process immediately after upload"  default(true)  Enums(true, false)
// @Success      201  {object}  response.ApiResponse[models.PunchLogFile]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      413  {object}  response.ApiResponse[any]
// @Failure      422  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/logs/upload [post]
func (h *LogsHandler) Upload(c *gin.Context) {
	limit := int64(h.maxUploadMB) << 20
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit)
	if err := c.Request.ParseMultipartForm(limit); err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("UPLOAD_INVALID", err.Error()))
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("UPLOAD_MISSING_FILE", "Multipart field 'file' is required."))
		return
	}
	if fileHeader.Size > limit {
		response.Fail(c, http.StatusRequestEntityTooLarge, response.Err("UPLOAD_TOO_LARGE", "File exceeds maximum upload size."))
		return
	}
	f, err := fileHeader.Open()
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("UPLOAD_OPEN_FAILED", err.Error()))
		return
	}
	defer f.Close()
	payload, err := io.ReadAll(f)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("UPLOAD_READ_FAILED", err.Error()))
		return
	}

	formCompanyID, _ := strconv.Atoi(c.PostForm("companyId"))
	companyID, ok := middleware.ResolveCompanyID(c, formCompanyID)
	if !ok {
		return
	}
	deviceID := strings.TrimSpace(c.PostForm("deviceId"))
	autoProcess := strings.EqualFold(c.DefaultPostForm("autoProcess", "true"), "true")

	now := time.Now().UTC()
	userID := middleware.UserID(c)
	importBatch := &models.PunchImportBatch{
		ID:          uuid.New(),
		CompanyID:   companyID,
		FileName:    fileHeader.Filename,
		ContentType: fileHeader.Header.Get("Content-Type"),
		Status:      models.ImportStatusPending,
		UploadedAt:  now,
	}
	if userID != uuid.Nil {
		importBatch.UploadedBy = &userID
	}
	if err := h.repo.CreateImportBatch(c.Request.Context(), importBatch); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("IMPORT_BATCH_FAILED", err.Error()))
		return
	}

	lf := &models.PunchLogFile{
		ID:            uuid.New(),
		ImportBatchID: &importBatch.ID,
		FileName:      fileHeader.Filename,
		SourceType:    "Upload",
		ContentType:   fileHeader.Header.Get("Content-Type"),
		DeviceID:      deviceID,
		CompanyID:     companyID,
		SizeBytes:     int64(len(payload)),
		Status:        models.StatusPending,
		UploadedAt:    now,
		RawPayload:    payload,
	}
	if err := h.repo.CreateLogFile(c.Request.Context(), lf); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("UPLOAD_SAVE_FAILED", err.Error()))
		return
	}

	if autoProcess {
		if _, err := h.proc.ProcessLogFile(c.Request.Context(), lf.ID, processor.ProcessOptions{ImportBatchID: &importBatch.ID}); err != nil {
			response.Fail(c, http.StatusUnprocessableEntity, response.Err("PROCESS_FAILED", err.Error()))
			return
		}
	}

	fresh, _ := h.repo.GetLogFile(c.Request.Context(), lf.ID)
	response.Created(c, fresh)
}

// Batch godoc
// @Summary      Ingest a JSON batch of punches
// @Description  Persists a raw JSON batch (no file) and, unless `autoProcess=false`, immediately normalises it into punch records.
// @Tags         logs
// @Accept       json
// @Produce      json
// @Param        autoProcess  query  string                 false  "Process immediately after persisting"  default(true)  Enums(true, false)
// @Param        body         body   processor.BatchPayload true   "Batch payload: companyId, deviceId, source, records[]"
// @Success      201  {object}  response.ApiResponse[models.PunchLogFile]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      422  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/logs/batch [post]
func (h *LogsHandler) Batch(c *gin.Context) {
	body, err := io.ReadAll(io.LimitReader(c.Request.Body, int64(h.maxUploadMB)<<20))
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("BATCH_READ_FAILED", err.Error()))
		return
	}
	if len(body) == 0 {
		response.Fail(c, http.StatusBadRequest, response.Err("BATCH_EMPTY", "Request body is empty."))
		return
	}

	batch, err := processor.Parse("application/json", "batch.json", body)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("BATCH_INVALID", err.Error()))
		return
	}

	reqCompanyID := 0
	if batch.CompanyID != nil {
		reqCompanyID = *batch.CompanyID
	}
	companyID, ok := middleware.ResolveCompanyID(c, reqCompanyID)
	if !ok {
		return
	}
	batch.CompanyID = &companyID

	autoProcess := strings.EqualFold(c.DefaultQuery("autoProcess", "true"), "true")
	now := time.Now().UTC()
	userID := middleware.UserID(c)
	importBatch := &models.PunchImportBatch{
		ID:          uuid.New(),
		CompanyID:   companyID,
		FileName:    "batch.json",
		ContentType: "application/json",
		Status:      models.ImportStatusPending,
		UploadedAt:  now,
	}
	if userID != uuid.Nil {
		importBatch.UploadedBy = &userID
	}
	if err := h.repo.CreateImportBatch(c.Request.Context(), importBatch); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("IMPORT_BATCH_FAILED", err.Error()))
		return
	}

	lf := &models.PunchLogFile{
		ID:            uuid.New(),
		ImportBatchID: &importBatch.ID,
		FileName:      "batch.json",
		SourceType:    "Batch",
		ContentType:   "application/json",
		DeviceID:      batch.DeviceID,
		CompanyID:     companyID,
		SizeBytes:     int64(len(body)),
		Status:        models.StatusPending,
		UploadedAt:    now,
		RawPayload:    body,
	}
	if err := h.repo.CreateLogFile(c.Request.Context(), lf); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("BATCH_SAVE_FAILED", err.Error()))
		return
	}

	if autoProcess {
		if _, err := h.proc.ProcessLogFile(c.Request.Context(), lf.ID, processor.ProcessOptions{ImportBatchID: &importBatch.ID}); err != nil {
			response.Fail(c, http.StatusUnprocessableEntity, response.Err("PROCESS_FAILED", err.Error()))
			return
		}
	}

	fresh, _ := h.repo.GetLogFile(c.Request.Context(), lf.ID)
	response.Created(c, fresh)
}

// List godoc
// @Summary      List uploaded log files
// @Description  Returns a paginated slice of log payloads, newest first.
// @Tags         logs
// @Produce      json
// @Param        companyId  query  int     false  "Filter by company id"
// @Param        deviceId   query  string  false  "Filter by device id"
// @Param        status     query  string  false  "Filter by status"  Enums(Pending, Processing, Completed, Failed)
// @Param        page       query  int     false  "Page number (1-based)"  default(1)
// @Param        pageSize   query  int     false  "Page size (max 200)"     default(50)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.PunchLogFile]]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/logs [get]
func (h *LogsHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("pageSize", "50"))

	f := repository.LogFileFilter{
		DeviceID: c.Query("deviceId"),
		Status:   c.Query("status"),
		Page:     page,
		PageSize: size,
	}
	if companyID, ok := middleware.CompanyID(c); ok {
		f.CompanyID = &companyID
	}

	items, total, err := h.repo.ListLogFiles(c.Request.Context(), f)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("LIST_FAILED", err.Error()))
		return
	}

	response.OK(c, response.PagedResult[models.PunchLogFile]{
		Items:      items,
		Page:       page,
		PageSize:   size,
		TotalCount: total,
	})
}

// Get godoc
// @Summary      Get log file metadata
// @Description  Returns a single log payload row without the raw bytes (use /download for the bytes).
// @Tags         logs
// @Produce      json
// @Param        id  path  string  true  "Log file id (uuid)"
// @Success      200  {object}  response.ApiResponse[models.PunchLogFile]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      404  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/logs/{id} [get]
func (h *LogsHandler) Get(c *gin.Context) {
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
	if !h.ensureLogCompany(c, lf) {
		return
	}
	response.OK(c, lf)
}

// Download godoc
// @Summary      Download the original raw payload
// @Description  Streams back the bytes of the original uploaded log file.
// @Tags         logs
// @Produce      octet-stream
// @Param        id  path  string  true  "Log file id (uuid)"
// @Success      200  {file}    binary
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      404  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/logs/{id}/download [get]
func (h *LogsHandler) Download(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_ID", "Invalid log id."))
		return
	}
	lf, err := h.repo.GetLogFileWithPayload(c.Request.Context(), id)
	if err != nil {
		response.Fail(c, http.StatusNotFound, response.Err("LOG_NOT_FOUND", err.Error()))
		return
	}
	if !h.ensureLogCompany(c, lf) {
		return
	}
	ct := lf.ContentType
	if ct == "" {
		ct = "application/octet-stream"
	}
	c.Header("Content-Disposition", `attachment; filename="`+sanitiseFileName(lf.FileName)+`"`)
	c.Data(http.StatusOK, ct, lf.RawPayload)
}

// ProcessOne godoc
// @Summary      (Re-)process a single log file
// @Description  Re-runs parsing + normalisation for the given log payload. Existing punch records derived from it are removed before reinsert.
// @Tags         logs
// @Produce      json
// @Param        id  path  string  true  "Log file id (uuid)"
// @Success      200  {object}  response.ApiResponse[processor.Result]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      422  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/logs/{id}/process [post]
func (h *LogsHandler) ProcessOne(c *gin.Context) {
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
	if !h.ensureLogCompany(c, lf) {
		return
	}
	opts := processor.ProcessOptions{}
	if lf.ImportBatchID != nil {
		opts.ImportBatchID = lf.ImportBatchID
	}
	res, err := h.proc.ProcessLogFile(c.Request.Context(), id, opts)
	if err != nil {
		response.Fail(c, http.StatusUnprocessableEntity, response.Err("PROCESS_FAILED", err.Error()))
		return
	}
	response.OK(c, res)
}

// ProcessAll godoc
// @Summary      Process all pending log files
// @Description  Runs the processor over every payload currently in `Pending` status, oldest first.
// @Tags         logs
// @Produce      json
// @Param        limit  query  int  false  "Maximum number of payloads to process in one call"  default(50)
// @Success      200  {object}  response.ApiResponse[[]processor.Result]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/process [post]
func (h *LogsHandler) ProcessAll(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	res, err := h.proc.ProcessPending(c.Request.Context(), limit)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("PROCESS_FAILED", err.Error()))
		return
	}
	response.OK(c, res)
}

func (h *LogsHandler) ensureLogCompany(c *gin.Context, lf *models.PunchLogFile) bool {
	return middleware.EnsureResourceCompany(c, lf.CompanyID)
}

func sanitiseFileName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "punch-log.bin"
	}
	for _, ch := range []string{"/", "\\", "\"", "\r", "\n"} {
		name = strings.ReplaceAll(name, ch, "_")
	}
	return name
}
