package middleware

import (
	"net/http"
	"slices"
	"strings"

	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/gin-gonic/gin"
)

// RequireAnyRole aborts with 403 unless caller has one of the roles (case-insensitive).
func RequireAnyRole(roles ...string) gin.HandlerFunc {
	return RequireAnyRoleOrPermission(roles, nil)
}

// RequireAnyRoleOrPermission allows access when the caller has any listed role or permission.
func RequireAnyRoleOrPermission(roles, permissions []string) gin.HandlerFunc {
	lowerRoles := make([]string, 0, len(roles))
	for _, r := range roles {
		if r = strings.ToLower(strings.TrimSpace(r)); r != "" {
			lowerRoles = append(lowerRoles, r)
		}
	}
	lowerPerms := make([]string, 0, len(permissions))
	for _, p := range permissions {
		if p = strings.ToLower(strings.TrimSpace(p)); p != "" {
			lowerPerms = append(lowerPerms, p)
		}
	}
	return func(c *gin.Context) {
		gotRoles, _ := c.Get(CtxRoles)
		roleList, _ := gotRoles.([]string)
		var haveRoles []string
		for _, r := range roleList {
			haveRoles = append(haveRoles, strings.ToLower(strings.TrimSpace(r)))
		}
		for _, want := range lowerRoles {
			if slices.Contains(haveRoles, want) {
				c.Next()
				return
			}
		}

		gotPerms, _ := c.Get(CtxPermissions)
		permList, _ := gotPerms.([]string)
		var havePerms []string
		for _, p := range permList {
			havePerms = append(havePerms, strings.ToLower(strings.TrimSpace(p)))
		}
		for _, want := range lowerPerms {
			if slices.Contains(havePerms, want) {
				c.Next()
				return
			}
		}

		response.FailWithStatus(c, http.StatusForbidden, response.Err("FORBIDDEN", "insufficient role or permission"))
		c.Abort()
	}
}
