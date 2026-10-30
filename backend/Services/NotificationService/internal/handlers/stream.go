package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"notificationservice/internal/sse"
)

// StreamHandler handles SSE connections for real-time notification delivery.
type StreamHandler struct {
	hub *sse.Hub
}

func NewStreamHandler(hub *sse.Hub) *StreamHandler {
	return &StreamHandler{hub: hub}
}

// GET /api/v1/notification/stream/:recipientId
// Opens a Server-Sent Events stream. The client receives a JSON event for
// every new notification sent to that recipient.
func (h *StreamHandler) Stream(c *gin.Context) {
	recipientId, err := uuid.Parse(c.Param("recipientId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipientId"})
		return
	}

	key := recipientId.String()
	ch := h.hub.Subscribe(key)
	defer h.hub.Unsubscribe(key, ch)

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")
	c.Writer.WriteHeader(http.StatusOK)

	// Send an initial ping so the client knows the connection is live
	fmt.Fprintf(c.Writer, ": ping\n\n")
	c.Writer.Flush()

	for {
		select {
		case n, ok := <-ch:
			if !ok {
				return
			}
			data, _ := json.Marshal(n)
			fmt.Fprintf(c.Writer, "data: %s\n\n", data)
			c.Writer.Flush()
		case <-c.Request.Context().Done():
			return
		}
	}
}
