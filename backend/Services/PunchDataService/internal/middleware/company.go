package middleware

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/gin-gonic/gin"
)

const ContextCompanyID = "auth.companyId"

// CompanyScope optionally stores companyId from the JWT when present.
// It does not require X-Company-Id or any header.
func CompanyScope() gin.HandlerFunc {
	return func(c *gin.Context) {
		if IsSuperAdmin(c) {
			if id, ok := companyIDFromClaims(c); ok {
				c.Set(ContextCompanyID, id)
			}
			c.Next()
			return
		}
		claimsValue, _ := c.Get("auth.claims")
		claims, _ := claimsValue.(map[string]any)
		raw, _ := claims["company_ids"].(string)
		var allowed []string
		if json.Unmarshal([]byte(raw), &allowed) != nil {
			if values, ok := claims["company_ids"].([]any); ok {
				for _, v := range values {
					if id, ok := v.(string); ok {
						allowed = append(allowed, id)
					}
				}
			}
		}
		active := strings.TrimSpace(c.GetHeader("X-Company-Id"))
		if active == "" {
			active, _ = claims["default_company_id"].(string)
		}
		found := false
		for _, id := range allowed {
			if strings.EqualFold(id, active) {
				found = true
			}
		}
		if !found {
			response.Fail(c, http.StatusForbidden, response.Err("COMPANY_FORBIDDEN", "An assigned company context is required."))
			return
		}
		mappings := map[string]int{}
		if json.Unmarshal([]byte(os.Getenv("PUNCHDATA_COMPANY_MAP_JSON")), &mappings) != nil {
			response.Fail(c, http.StatusServiceUnavailable, response.Err("COMPANY_MAPPING", "Company mapping is not configured."))
			return
		}
		numeric := 0
		for id, n := range mappings {
			if strings.EqualFold(id, active) {
				numeric = n
			}
		}
		if numeric <= 0 {
			response.Fail(c, http.StatusForbidden, response.Err("COMPANY_MAPPING", "The selected company has no punch-data mapping."))
			return
		}
		// Multiple GUIDs cannot share a numeric tenant in the legacy store.
		matches := 0
		for _, n := range mappings {
			if n == numeric {
				matches++
			}
		}
		if matches != 1 {
			response.Fail(c, http.StatusForbidden, response.Err("COMPANY_MAPPING", "Ambiguous company mapping requires administrator correction."))
			return
		}
		c.Set(ContextCompanyID, numeric)
		if requested := strings.TrimSpace(c.Query("companyId")); requested != "" && requested != strconv.Itoa(numeric) {
			response.Fail(c, http.StatusForbidden, response.Err("COMPANY_FORBIDDEN", "Company scope mismatch."))
			return
		}
		c.Next()
	}
}

// CompanyID returns companyId from query ?companyId=, then JWT context if set.
func CompanyID(c *gin.Context) (int, bool) {
	if v := strings.TrimSpace(c.Query("companyId")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n, true
		}
	}
	if v, ok := c.Get(ContextCompanyID); ok {
		if id, ok := v.(int); ok && id > 0 {
			return id, true
		}
	}
	return 0, false
}

// ResolveCompanyID picks companyId from the request body/value, then query, then JWT.
func ResolveCompanyID(c *gin.Context, requested int) (int, bool) {
	if requested > 0 {
		if !IsSuperAdmin(c) {
			if scope, ok := c.Get(ContextCompanyID); !ok || scope != requested {
				response.Fail(c, http.StatusForbidden, response.Err("COMPANY_FORBIDDEN", "Company scope mismatch."))
				return 0, false
			}
		}
		return requested, true
	}
	if id, ok := CompanyID(c); ok {
		return id, true
	}
	response.Fail(c, http.StatusBadRequest, response.Err("COMPANY_REQUIRED", "companyId is required in the request body or query."))
	return 0, false
}

// EnsureResourceCompany rejects access when an explicit companyId scope does not match the resource.
func EnsureResourceCompany(c *gin.Context, resourceCompanyID int) bool {
	if !IsSuperAdmin(c) {
		if scope, ok := c.Get(ContextCompanyID); !ok || scope != resourceCompanyID {
			response.Fail(c, http.StatusForbidden, response.Err("COMPANY_FORBIDDEN", "Resource belongs to another company."))
			return false
		}
	}
	if scope, ok := CompanyID(c); ok && scope != resourceCompanyID {
		response.Fail(c, http.StatusForbidden, response.Err("COMPANY_FORBIDDEN", "Resource belongs to another company."))
		return false
	}
	return true
}

func companyIDFromClaims(c *gin.Context) (int, bool) {
	claims, ok := c.Get("auth.claims")
	if !ok {
		return 0, false
	}
	m, ok := claims.(map[string]any)
	if !ok {
		return 0, false
	}
	for _, key := range []string{"companyId", "company_id", "CompanyId"} {
		switch v := m[key].(type) {
		case float64:
			if int(v) > 0 {
				return int(v), true
			}
		case string:
			if n, err := strconv.Atoi(strings.TrimSpace(v)); err == nil && n > 0 {
				return n, true
			}
		}
	}
	return 0, false
}
