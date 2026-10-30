package middleware

import (
	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"os"
	"time"
)

// SessionActive fails closed when the authoritative account/session is revoked or unavailable.
func SessionActive() gin.HandlerFunc {
	client := &http.Client{Timeout: 5 * time.Second}
	endpoint := os.Getenv("ERP_AUTH_SESSION_URL")
	if endpoint == "" {
		endpoint = "http://127.0.0.1:5000/api/v1/auth/me"
	}
	return func(c *gin.Context) {
		req, err := http.NewRequestWithContext(c.Request.Context(), "GET", endpoint, nil)
		if err != nil {
			c.AbortWithStatus(http.StatusServiceUnavailable)
			return
		}
		req.Header.Set("Authorization", c.GetHeader("Authorization"))
		res, err := client.Do(req)
		if err != nil {
			response.FailWithStatus(c, http.StatusServiceUnavailable, response.Err("AUTH_UNAVAILABLE", "Account verification is unavailable."))
			c.Abort()
			return
		}
		defer res.Body.Close()
		io.Copy(io.Discard, io.LimitReader(res.Body, 65536))
		if res.StatusCode != http.StatusOK {
			response.FailWithStatus(c, http.StatusUnauthorized, response.Err("SESSION_REVOKED", "Sign in again to continue."))
			c.Abort()
			return
		}
		c.Next()
	}
}
