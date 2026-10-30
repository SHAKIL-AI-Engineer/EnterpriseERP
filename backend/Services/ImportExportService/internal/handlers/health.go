package handlers

import (
	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HealthHandler struct {
	DB *gorm.DB
}

func NewHealthHandler(db *gorm.DB) *HealthHandler {
	return &HealthHandler{DB: db}
}

// Get godoc
// @Summary      Health check
// @Description  Liveness probe and SQL Server ping.
// @Tags         health
// @Produce      json
// @Success      200  {object}  APIResponseHealth
// @Router       /health [get]
func (h *HealthHandler) Get(c *gin.Context) {
	sqlDB, err := h.DB.DB()
	status := "healthy"
	if err != nil || sqlDB.Ping() != nil {
		status = "degraded"
	}
	response.OK(c, gin.H{"service": "ImportExportService", "status": status})
}
