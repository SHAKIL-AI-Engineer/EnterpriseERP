package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"notificationservice/internal/models"
	"notificationservice/internal/repository"
)

type TemplateHandler struct {
	repo *repository.TemplateRepository
}

func NewTemplateHandler(repo *repository.TemplateRepository) *TemplateHandler {
	return &TemplateHandler{repo: repo}
}

// GET /api/v1/notification/templates
func (h *TemplateHandler) List(c *gin.Context) {
	list, err := h.repo.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch templates"})
		return
	}
	c.JSON(http.StatusOK, list)
}

// GET /api/v1/notification/templates/:id
func (h *TemplateHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	t, err := h.repo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "template not found"})
		return
	}
	c.JSON(http.StatusOK, t)
}

// POST /api/v1/notification/templates
func (h *TemplateHandler) Create(c *gin.Context) {
	var t models.NotificationTemplate
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.Create(&t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create template"})
		return
	}
	c.JSON(http.StatusCreated, t)
}
