package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/enterprise-erp/punchdata/internal/devices/zkteco"
	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/enterprise-erp/punchdata/internal/sync"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MachinesHandler struct {
	repo   *repository.Repository
	zk     *zkteco.Client
	syncer *sync.Service
}

func NewMachinesHandler(repo *repository.Repository, zk *zkteco.Client, syncer *sync.Service) *MachinesHandler {
	return &MachinesHandler{repo: repo, zk: zk, syncer: syncer}
}

type CreateMachineRequest struct {
	CompanyID    int    `json:"companyId"`
	DeviceCode   string `json:"deviceCode"`
	DeviceName   string `json:"deviceName"`
	MachineNo    int    `json:"machineNo"`
	IPAddress    string `json:"ipAddress"`
	Port         int    `json:"port"`
	UseTCP       *bool  `json:"useTcp,omitempty"`
	ProductName  string `json:"productName,omitempty"`
	SerialNumber string `json:"serialNumber,omitempty"`
	Password     *int   `json:"password,omitempty"`
	IsActive     *bool  `json:"isActive,omitempty"`
}

type BulkMachineRequest struct {
	Machines []CreateMachineRequest `json:"machines"`
}

// Create godoc
// @Summary      Create or update a punch machine
// @Tags         machines
// @Accept       json
// @Produce      json
// @Param        body  body  CreateMachineRequest  true  "Punch machine details"
// @Success      201  {object}  response.ApiResponse[models.PunchMachine]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/machines [post]
func (h *MachinesHandler) Create(c *gin.Context) {
	var req CreateMachineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("MACHINE_INVALID", err.Error()))
		return
	}
	machine, ok := h.machineFromRequest(c, req)
	if !ok {
		return
	}
	if err := h.repo.UpsertPunchMachine(c.Request.Context(), machine); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("MACHINE_SAVE_FAILED", err.Error()))
		return
	}
	fresh, err := h.repo.GetPunchMachineByCompanyDeviceCode(c.Request.Context(), machine.CompanyID, machine.DeviceCode)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("MACHINE_LOAD_FAILED", err.Error()))
		return
	}
	response.Created(c, fresh)
}

// Bulk godoc
// @Summary      Create or update punch machines in bulk
// @Description  Upserts each machine in the machines array.
// @Tags         machines
// @Accept       json
// @Produce      json
// @Param        body  body  BulkMachineRequest  true  "Punch machines"
// @Success      201  {object}  response.ApiResponse[[]models.PunchMachine]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/machines/bulk [post]
func (h *MachinesHandler) Bulk(c *gin.Context) {
	var req BulkMachineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("MACHINE_INVALID", err.Error()))
		return
	}
	if len(req.Machines) == 0 {
		response.Fail(c, http.StatusBadRequest, response.Err("MACHINE_EMPTY", "At least one machine is required."))
		return
	}

	items := make([]models.PunchMachine, 0, len(req.Machines))
	for _, item := range req.Machines {
		machine, ok := h.machineFromRequest(c, item)
		if !ok {
			return
		}
		if err := h.repo.UpsertPunchMachine(c.Request.Context(), machine); err != nil {
			response.Fail(c, http.StatusInternalServerError, response.Err("MACHINE_SAVE_FAILED", err.Error()))
			return
		}
		fresh, err := h.repo.GetPunchMachineByCompanyDeviceCode(c.Request.Context(), machine.CompanyID, machine.DeviceCode)
		if err != nil {
			response.Fail(c, http.StatusInternalServerError, response.Err("MACHINE_LOAD_FAILED", err.Error()))
			return
		}
		items = append(items, *fresh)
	}
	response.Created(c, items)
}

// List godoc
// @Summary      List punch machines
// @Tags         machines
// @Produce      json
// @Param        companyId  query  int     false  "Filter by company id"
// @Param        status     query  string  false  "Connection status filter"
// @Param        isActive   query  bool    false  "Filter by active flag"
// @Param        page       query  int     false  "Page (1-based)"  default(1)
// @Param        pageSize   query  int     false  "Page size"  default(50)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.PunchMachine]]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/machines [get]
func (h *MachinesHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("pageSize", "50"))
	f := repository.PunchMachineFilter{
		Status:   strings.TrimSpace(c.Query("status")),
		Page:     page,
		PageSize: size,
	}
	if companyID, ok := middleware.CompanyID(c); ok {
		f.CompanyID = &companyID
	}
	if v := c.Query("isActive"); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			f.IsActive = &b
		}
	}

	items, total, err := h.repo.ListPunchMachines(c.Request.Context(), f)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("MACHINE_LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.PunchMachine]{
		Items: items, Page: page, PageSize: size, TotalCount: total,
	})
}

// Connect godoc
// @Summary      Test punch machine connectivity
// @Tags         machines
// @Produce      json
// @Param        id  path  string  true  "Machine id (uuid)"
// @Success      200  {object}  response.ApiResponse[zkteco.ConnectionResult]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      502  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/machines/{id}/connect [post]
func (h *MachinesHandler) Connect(c *gin.Context) {
	machine, ok := h.machineByID(c)
	if !ok {
		return
	}
	result, err := h.zk.TestConnection(c.Request.Context(), *machine)
	if err != nil {
		msg := trimError(err)
		_ = h.repo.UpdatePunchMachineConnection(c.Request.Context(), machine.ID, models.MachineStatusDisconnected, nil, &msg)
		response.Fail(c, http.StatusBadGateway, response.Err("MACHINE_CONNECT_FAILED", msg))
		return
	}
	checkedAt := result.CheckedAt
	_ = h.repo.UpdatePunchMachineConnection(c.Request.Context(), machine.ID, models.MachineStatusConnected, &checkedAt, nil)
	response.OK(c, result)
}

// Sync godoc
// @Summary      Manually sync attendance from a punch machine
// @Description  Downloads ZKTeco attendance logs, stores a raw PunchLogFile, and processes it into PunchRecords. Attendance calculation is handled by AttendanceService.
// @Tags         machines
// @Produce      json
// @Param        id  path  string  true  "Machine id (uuid)"
// @Success      200  {object}  response.ApiResponse[sync.Result]
// @Failure      400  {object}  response.ApiResponse[any]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      502  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/machines/{id}/sync [post]
func (h *MachinesHandler) Sync(c *gin.Context) {
	machine, ok := h.machineByID(c)
	if !ok {
		return
	}
	if !machine.IsActive {
		response.Fail(c, http.StatusBadRequest, response.Err("MACHINE_INACTIVE", "Inactive device cannot sync."))
		return
	}

	forceRemote := strings.EqualFold(strings.TrimSpace(c.Query("useRemote")), "true")
	result, err := h.syncer.SyncMachineOptions(c.Request.Context(), *machine, models.SyncTriggerManual, forceRemote)
	if err != nil {
		status := http.StatusBadGateway
		if strings.Contains(strings.ToLower(err.Error()), "not configured") {
			status = http.StatusServiceUnavailable
		}
		response.Fail(c, status, response.Err("MACHINE_SYNC_FAILED", trimError(err)))
		return
	}
	response.OK(c, result)
}

// ListSyncHistory godoc
// @Summary      List device sync history
// @Tags         machines
// @Produce      json
// @Param        companyId  query  int     false  "Filter by company id"
// @Param        status     query  string  false  "Sync status filter"
// @Param        page       query  int     false  "Page (1-based)"  default(1)
// @Param        pageSize   query  int     false  "Page size"  default(50)
// @Success      200  {object}  response.ApiResponse[response.PagedResult[models.DeviceSyncHistory]]
// @Failure      401  {object}  response.ApiResponse[any]
// @Failure      500  {object}  response.ApiResponse[any]
// @Security     BearerAuth
// @Router       /api/v1/punch-data/sync-histories [get]
func (h *MachinesHandler) ListSyncHistory(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("pageSize", "50"))
	f := repository.SyncHistoryFilter{
		Status:   strings.TrimSpace(c.Query("status")),
		Page:     page,
		PageSize: size,
	}
	if companyID, ok := middleware.CompanyID(c); ok {
		f.CompanyID = &companyID
	}
	if v := c.Param("id"); v != "" {
		if machineID, err := uuid.Parse(v); err == nil {
			f.MachineID = &machineID
		}
	}
	if v := c.Query("machineId"); v != "" {
		if machineID, err := uuid.Parse(v); err == nil {
			f.MachineID = &machineID
		}
	}
	items, total, err := h.repo.ListDeviceSyncHistories(c.Request.Context(), f)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.Err("SYNC_HISTORY_LIST_FAILED", err.Error()))
		return
	}
	response.OK(c, response.PagedResult[models.DeviceSyncHistory]{
		Items: items, Page: page, PageSize: size, TotalCount: total,
	})
}

func (h *MachinesHandler) machineFromRequest(c *gin.Context, req CreateMachineRequest) (*models.PunchMachine, bool) {
	req.DeviceName = strings.TrimSpace(req.DeviceName)
	req.DeviceCode = strings.TrimSpace(req.DeviceCode)
	req.IPAddress = strings.TrimSpace(req.IPAddress)
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.SerialNumber = strings.TrimSpace(req.SerialNumber)

	companyID, ok := middleware.ResolveCompanyID(c, req.CompanyID)
	if !ok {
		return nil, false
	}
	if req.DeviceName == "" {
		response.Fail(c, http.StatusBadRequest, response.Err("MACHINE_NAME_REQUIRED", "deviceName is required."))
		return nil, false
	}
	if req.MachineNo <= 0 {
		response.Fail(c, http.StatusBadRequest, response.Err("MACHINE_NO_REQUIRED", "machineNo is required."))
		return nil, false
	}
	if req.DeviceCode == "" {
		req.DeviceCode = strconv.Itoa(req.MachineNo)
	}
	if req.IPAddress == "" {
		response.Fail(c, http.StatusBadRequest, response.Err("MACHINE_IP_REQUIRED", "ipAddress is required."))
		return nil, false
	}
	if req.Port <= 0 {
		response.Fail(c, http.StatusBadRequest, response.Err("MACHINE_PORT_REQUIRED", "port is required."))
		return nil, false
	}

	// Most ZKTeco F18/K40 devices on port 4370 use UDP; TCP often triggers "RWB Not supported" on sync.
	useTCP := false
	if req.UseTCP != nil {
		useTCP = *req.UseTCP
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	now := time.Now().UTC()
	return &models.PunchMachine{
		ID:                   uuid.New(),
		CompanyID:            companyID,
		DeviceCode:           req.DeviceCode,
		DeviceName:           req.DeviceName,
		MachineNo:            req.MachineNo,
		IPAddress:            req.IPAddress,
		Port:                 req.Port,
		UseTCP:               useTCP,
		ProductName:          req.ProductName,
		SerialNumber:         req.SerialNumber,
		Password:             req.Password,
		IsActive:             isActive,
		LastConnectionStatus: models.MachineStatusUnknown,
		CreatedAt:            now,
		UpdatedAt:            now,
	}, true
}

func (h *MachinesHandler) machineByID(c *gin.Context) (*models.PunchMachine, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.Err("INVALID_ID", "Invalid machine id."))
		return nil, false
	}
	machine, err := h.repo.GetPunchMachine(c.Request.Context(), id)
	if err != nil {
		response.Fail(c, http.StatusNotFound, response.Err("MACHINE_NOT_FOUND", err.Error()))
		return nil, false
	}
	if !middleware.EnsureResourceCompany(c, machine.CompanyID) {
		return nil, false
	}
	return machine, true
}

func trimError(err error) string {
	msg := strings.TrimSpace(err.Error())
	if len(msg) > 1900 {
		msg = msg[:1900] + "..."
	}
	return msg
}
