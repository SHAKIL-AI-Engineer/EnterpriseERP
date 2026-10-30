package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type Envelope struct {
	Success bool          `json:"success"`
	TraceID string        `json:"traceId,omitempty"`
	Data    any           `json:"data,omitempty"`
	Errors  []ErrorDetail `json:"errors,omitempty"`
	Message string        `json:"message,omitempty"`
}

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Envelope{Success: true, Data: data, TraceID: c.GetString("traceId")})
}

func FailWithStatus(c *gin.Context, status int, errs ...ErrorDetail) {
	c.JSON(status, Envelope{Success: false, Errors: errs, TraceID: c.GetString("traceId")})
}

func Err(code, msg string) ErrorDetail {
	return ErrorDetail{Code: code, Message: msg}
}
