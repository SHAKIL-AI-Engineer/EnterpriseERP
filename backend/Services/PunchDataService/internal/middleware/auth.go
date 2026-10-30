package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/enterprise-erp/punchdata/internal/response"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JwtConfig holds the validation parameters that must match AuthService.
type JwtConfig struct {
	Issuer     string
	Audience   string
	SigningKey string
}

// Context keys for downstream handlers.
const (
	ContextUserID       = "auth.userId"
	ContextRoles        = "auth.roles"
	ContextPermissions  = "auth.permissions"
)

// JWTAuth validates HS256 bearer tokens issued by AuthService and exposes the
// caller's user id, roles, and permissions on the gin context.
func JWTAuth(cfg JwtConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Fail(c, http.StatusUnauthorized, response.Err("AUTH_MISSING", "Missing bearer token."))
			return
		}
		raw := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))

		token, err := jwt.Parse(raw, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(cfg.SigningKey), nil
		},
			jwt.WithIssuer(cfg.Issuer),
			jwt.WithAudience(cfg.Audience),
			jwt.WithValidMethods([]string{"HS256"}),
		)
		if err != nil || !token.Valid {
			response.Fail(c, http.StatusUnauthorized, response.Err("AUTH_INVALID", "Invalid or expired token."))
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.Fail(c, http.StatusUnauthorized, response.Err("AUTH_INVALID", "Malformed token claims."))
			return
		}

		userID := extractUserID(claims)
		if userID == uuid.Nil {
			response.Fail(c, http.StatusUnauthorized, response.Err("AUTH_INVALID", "Missing user id claim."))
			return
		}

		c.Set(ContextUserID, userID)
		c.Set(ContextRoles, extractRoles(claims))
		c.Set(ContextPermissions, extractPermissions(claims))
		c.Set("auth.claims", map[string]any(claims))

		c.Next()
	}
}

func extractUserID(claims jwt.MapClaims) uuid.UUID {
	candidates := []string{
		"sub",
		"nameid",
		"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
	}
	for _, k := range candidates {
		if v, ok := claims[k].(string); ok && v != "" {
			if id, err := uuid.Parse(v); err == nil {
				return id
			}
		}
	}
	return uuid.Nil
}

func extractRoles(claims jwt.MapClaims) []string {
	keys := []string{
		"role",
		"roles",
		"http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
	}
	var out []string
	for _, k := range keys {
		v, ok := claims[k]
		if !ok {
			continue
		}
		switch t := v.(type) {
		case string:
			out = append(out, t)
		case []any:
			for _, item := range t {
				if s, ok := item.(string); ok {
					out = append(out, s)
				}
			}
		}
	}
	return out
}

func extractPermissions(claims jwt.MapClaims) []string {
	keys := []string{"permission", "permissions"}
	var out []string
	seen := map[string]struct{}{}
	for _, k := range keys {
		v, ok := claims[k]
		if !ok {
			continue
		}
		switch t := v.(type) {
		case string:
			appendUnique(&out, seen, t)
		case []any:
			for _, item := range t {
				if s, ok := item.(string); ok {
					appendUnique(&out, seen, s)
				}
			}
		}
	}
	return out
}

func appendUnique(out *[]string, seen map[string]struct{}, value string) {
	value = strings.TrimSpace(value)
	if value == "" {
		return
	}
	key := strings.ToLower(value)
	if _, ok := seen[key]; ok {
		return
	}
	seen[key] = struct{}{}
	*out = append(*out, value)
}
