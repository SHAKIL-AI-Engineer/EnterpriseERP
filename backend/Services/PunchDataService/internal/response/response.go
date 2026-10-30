package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ApiResponse mirrors the .NET ApiResponse<T> shape so frontend clients can
// use one common envelope across every service.
type ApiResponse[T any] struct {
	Success bool       `json:"success"`
	TraceID string     `json:"traceId,omitempty"`
	Data    T          `json:"data,omitempty"`
	Errors  []ApiError `json:"errors,omitempty"`
}

type ApiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// PagedResult is the standard pagination envelope shared with the .NET services.
type PagedResult[T any] struct {
	Items      []T   `json:"items"`
	Page       int   `json:"page"`
	PageSize   int   `json:"pageSize"`
	TotalCount int64 `json:"totalCount"`
}

// TraceID extracts the request trace id (set by the correlation middleware).
func TraceID(c *gin.Context) string {
	if v, ok := c.Get("CorrelationId"); ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return c.GetString("RequestID")
}

// OK writes a 200 success response with the given payload.
func OK[T any](c *gin.Context, data T) {
	c.JSON(http.StatusOK, ApiResponse[T]{
		Success: true,
		TraceID: TraceID(c),
		Data:    data,
	})
}

// Created writes a 201 success response.
func Created[T any](c *gin.Context, data T) {
	c.JSON(http.StatusCreated, ApiResponse[T]{
		Success: true,
		TraceID: TraceID(c),
		Data:    data,
	})
}

// Fail writes a non-2xx error response.
func Fail(c *gin.Context, status int, errs ...ApiError) {
	if len(errs) == 0 {
		errs = []ApiError{{Code: "ERROR", Message: http.StatusText(status)}}
	}
	c.AbortWithStatusJSON(status, ApiResponse[any]{
		Success: false,
		TraceID: TraceID(c),
		Errors:  errs,
	})
}

// Err builds a single ApiError.
func Err(code, message string) ApiError { return ApiError{Code: code, Message: message} }
