package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CorrelationID assigns a per-request correlation id, prefers an incoming
// header, and exposes it on the response. The id is also stored on the gin
// context under "CorrelationId" so the response wrapper can echo it.
func CorrelationID() gin.HandlerFunc {
	const header = "X-Correlation-Id"
	return func(c *gin.Context) {
		id := c.GetHeader(header)
		if id == "" {
			id = uuid.NewString()
		}
		c.Set("CorrelationId", id)
		c.Writer.Header().Set(header, id)
		c.Next()
	}
}
