package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/enterprise-erp/punchdata/internal/remote"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// HealthHandler reports liveness + a basic DB ping.
type HealthHandler struct {
	db           *gorm.DB
	remoteReader *remote.Reader
}

func NewHealthHandler(db *gorm.DB, remoteDB *sql.DB) *HealthHandler {
	var reader *remote.Reader
	if remoteDB != nil {
		reader = remote.NewReader(remoteDB)
	}
	return &HealthHandler{db: db, remoteReader: reader}
}

// HealthResponse is the payload returned by GET /health.
type HealthResponse struct {
	Service      string `json:"service" example:"PunchDataService"`
	Status       string `json:"status"  example:"Healthy"`
	DB           string `json:"db,omitempty"`
	RemoteZkteco string `json:"remoteZkteco,omitempty"`
}

// Get godoc
// @Summary      Health check
// @Description  Liveness probe + local PunchDataDB ping. When remote collect is configured, includes public ZKTeco SQL reachability (read-only ping).
// @Tags         health
// @Produce      json
// @Success      200  {object}  HealthResponse
// @Failure      503  {object}  HealthResponse
// @Router       /health [get]
func (h *HealthHandler) Get(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	out := HealthResponse{Service: "PunchDataService", Status: "Healthy", DB: "Healthy"}
	if sqlDB, err := h.db.DB(); err != nil || sqlDB.PingContext(ctx) != nil {
		out.Status = "Degraded"
		out.DB = "Unhealthy"
	}
	if h.remoteReader != nil {
		out.RemoteZkteco = "Healthy"
		if err := h.remoteReader.Ping(ctx); err != nil {
			out.RemoteZkteco = "Unhealthy"
			if out.Status == "Healthy" {
				out.Status = "Degraded"
			}
		}
	}
	if out.DB != "Healthy" {
		c.JSON(http.StatusServiceUnavailable, out)
		return
	}
	c.JSON(http.StatusOK, out)
}
