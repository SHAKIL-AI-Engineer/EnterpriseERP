package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UserID(c *gin.Context) uuid.UUID {
	v, _ := c.Get(ContextUserID)
	id, _ := v.(uuid.UUID)
	return id
}
