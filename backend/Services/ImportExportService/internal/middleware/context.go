package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UserID(c *gin.Context) uuid.UUID {
	v, _ := c.Get(CtxUserID)
	id, _ := v.(uuid.UUID)
	return id
}

func CompanyID(c *gin.Context) (uuid.UUID, bool) {
	v, ok := c.Get(CtxCompanyID)
	if !ok {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

func BearerToken(c *gin.Context) string {
	v, _ := c.Get(CtxBearerToken)
	s, _ := v.(string)
	return s
}
