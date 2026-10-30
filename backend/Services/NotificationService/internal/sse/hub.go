package sse

import (
	"sync"

	"notificationservice/internal/models"
)

// Hub manages SSE client subscriptions keyed by recipientId string.
type Hub struct {
	mu      sync.RWMutex
	clients map[string][]chan models.Notification
}

var Default = &Hub{clients: make(map[string][]chan models.Notification)}

func (h *Hub) Subscribe(recipientId string) chan models.Notification {
	ch := make(chan models.Notification, 8)
	h.mu.Lock()
	h.clients[recipientId] = append(h.clients[recipientId], ch)
	h.mu.Unlock()
	return ch
}

func (h *Hub) Unsubscribe(recipientId string, ch chan models.Notification) {
	h.mu.Lock()
	defer h.mu.Unlock()
	list := h.clients[recipientId]
	for i, c := range list {
		if c == ch {
			h.clients[recipientId] = append(list[:i], list[i+1:]...)
			break
		}
	}
	if len(h.clients[recipientId]) == 0 {
		delete(h.clients, recipientId)
	}
	close(ch)
}

// Broadcast sends n to all SSE subscribers for its recipientId.
func (h *Hub) Broadcast(n models.Notification) {
	key := n.RecipientId.String()
	h.mu.RLock()
	channels := make([]chan models.Notification, len(h.clients[key]))
	copy(channels, h.clients[key])
	h.mu.RUnlock()
	for _, ch := range channels {
		select {
		case ch <- n:
		default: // skip slow clients
		}
	}
}
