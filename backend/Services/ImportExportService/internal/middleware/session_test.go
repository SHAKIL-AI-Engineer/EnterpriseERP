package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSessionRevocationAndServiceFailure(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, status := range []int{200, 401, 503} {
		t.Run(http.StatusText(status), func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Header.Get("Authorization") != "Bearer fixture" {
					t.Error("missing forwarded identity")
				}
				w.WriteHeader(status)
			}))
			defer server.Close()
			t.Setenv("ERP_AUTH_SESSION_URL", server.URL)
			router := gin.New()
			router.Use(SessionActive())
			router.GET("/", func(c *gin.Context) { c.Status(200) })
			req := httptest.NewRequest("GET", "/", nil)
			req.Header.Set("Authorization", "Bearer fixture")
			res := httptest.NewRecorder()
			router.ServeHTTP(res, req)
			if status == 200 && res.Code != 200 {
				t.Fatalf("active session: %d", res.Code)
			}
			if status != 200 && res.Code == 200 {
				t.Fatal("inactive/unavailable session accepted")
			}
		})
	}
}
