package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http/httptest"
	"testing"
)

func TestCompanyScopeRejectsOtherCompanyAndAmbiguousMapping(t *testing.T) {
	gin.SetMode(gin.TestMode)
	const company = "00000000-0000-0000-0000-000000000001"
	cases := []struct {
		name, mapping, query string
		want                 int
	}{
		{"assigned", `{"00000000-0000-0000-0000-000000000001":1}`, "1", 200},
		{"other company", `{"00000000-0000-0000-0000-000000000001":1}`, "2", 403},
		{"ambiguous", `{"00000000-0000-0000-0000-000000000001":1,"00000000-0000-0000-0000-000000000002":1}`, "1", 403},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("PUNCHDATA_COMPANY_MAP_JSON", tc.mapping)
			r := gin.New()
			r.Use(func(c *gin.Context) {
				c.Set("auth.claims", map[string]any{"company_ids": `["` + company + `"]`, "default_company_id": company})
				c.Next()
			})
			r.Use(CompanyScope())
			r.GET("/", func(c *gin.Context) { c.Status(200) })
			res := httptest.NewRecorder()
			r.ServeHTTP(res, httptest.NewRequest("GET", "/?companyId="+tc.query, nil))
			if res.Code != tc.want {
				t.Fatalf("got %d want %d", res.Code, tc.want)
			}
		})
	}
}
