package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"notificationservice/internal/models"
	"notificationservice/internal/repository"
	"notificationservice/internal/sse"
)

type NotificationHandler struct {
	repo *repository.NotificationRepository
	hub  *sse.Hub
}

func NewNotificationHandler(repo *repository.NotificationRepository, hub *sse.Hub) *NotificationHandler {
	return &NotificationHandler{repo: repo, hub: hub}
}

// POST /api/v1/notification/send
func (h *NotificationHandler) Send(c *gin.Context) {
	var req models.SendNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	n := models.Notification{
		RecipientId:    req.RecipientId,
		RecipientEmail: req.RecipientEmail,
		RecipientPhone: req.RecipientPhone,
		Type:           req.Type,
		Subject:        req.Subject,
		Body:           req.Body,
	}

	if err := h.repo.Create(&n); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save notification"})
		return
	}

	// Broadcast to any SSE subscribers for this recipient
	h.hub.Broadcast(n)

	c.JSON(http.StatusOK, n)
}

// GET /api/v1/notification/recipient/:recipientId
func (h *NotificationHandler) ListByRecipient(c *gin.Context) {
	id, err := uuid.Parse(c.Param("recipientId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipientId"})
		return
	}

	list, err := h.repo.ListByRecipient(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch notifications"})
		return
	}
	c.JSON(http.StatusOK, list)
}

// PUT /api/v1/notification/:id/read
func (h *NotificationHandler) MarkRead(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.repo.MarkRead(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update notification"})
		return
	}
	c.Status(http.StatusNoContent)
}

// DELETE /api/v1/notification/:id
func (h *NotificationHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.repo.SoftDelete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete notification"})
		return
	}
	c.Status(http.StatusNoContent)
}

// GET /api/v1/notification/unread-count/:recipientId
func (h *NotificationHandler) UnreadCount(c *gin.Context) {
	id, err := uuid.Parse(c.Param("recipientId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipientId"})
		return
	}
	count, err := h.repo.UnreadCount(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}
