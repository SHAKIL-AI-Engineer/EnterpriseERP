package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTAuth returns a Gin middleware that validates Bearer tokens using the
// same HS256 signing key as the .NET services.
func JWTAuth(signingKey, issuer, audience string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := ""
		if authHeader := c.GetHeader("Authorization"); authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				tokenString = parts[1]
			}
		}
		// EventSource cannot send headers; allow token via query (used by hrhub SSE hook).
		if tokenString == "" {
			tokenString = c.Query("access_token")
		}
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header or access_token"})
			return
		}
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return []byte(signingKey), nil
		}, jwt.WithIssuer(issuer), jwt.WithAudience(audience))

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		// Expose useful claims to handlers
		if sub, ok := claims["sub"].(string); ok {
			c.Set("userId", sub)
		}
		if name, ok := claims["name"].(string); ok {
			c.Set("userName", name)
		}

		c.Next()
	}
}
