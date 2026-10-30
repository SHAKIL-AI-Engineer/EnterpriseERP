package router

import (
	"net/http"
	"strings"

	"github.com/enterprise-erp/importexport/internal/handlers"
	"github.com/enterprise-erp/importexport/internal/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type Options struct {
	AllowedOrigins []string
	Jwt            middleware.JwtConfig
	Health         *handlers.HealthHandler
	Import         *handlers.ImportHandler
	Export         *handlers.ExportHandler
	Organogram     *handlers.CompanyOrganogramHandler
	Address        *handlers.AddressHandler
	Jobs           *handlers.JobsHandler
	Templates      *handlers.TemplateHandler
	ReportExport   *handlers.ReportExportHandler
}

func New(opts Options) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.TraceID())
	r.Use(corsMiddleware(opts.AllowedOrigins))

	r.GET("/health", opts.Health.Get)
	r.GET("/api/v1/import-export/health", opts.Health.Get)

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/", func(c *gin.Context) { c.Redirect(302, "/swagger/index.html") })

	gatewaySwagger := ginSwagger.WrapHandler(
		swaggerFiles.Handler,
		ginSwagger.URL("/api/v1/import-export/swagger/doc.json"),
	)
	r.GET("/api/v1/import-export/swagger/*any", gatewaySwagger)

	api := r.Group("/api/v1/import-export")
	api.Use(middleware.JWTAuth(opts.Jwt))
	api.Use(middleware.SessionActive())
	api.Use(func(c *gin.Context) {
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" {
			middleware.RequireAnyRoleOrPermission([]string{"SuperAdmin", "Admin"}, []string{"hr.employees.read", "REPORT_VIEW", "LEDGER_VIEW", "CUTTING_REPORT_VIEW"})(c)
			return
		}
		if c.FullPath() == "/api/v1/import-export/address/import" {
			middleware.RequireAnyRole("SuperAdmin")(c)
			return
		}
		if strings.Contains(c.FullPath(), "/export/") || strings.Contains(c.FullPath(), "/reports/") {
			middleware.RequireAnyRoleOrPermission([]string{"SuperAdmin", "Admin"}, []string{"REPORT_VIEW", "LEDGER_VIEW", "CUTTING_REPORT_VIEW"})(c)
			return
		}
		middleware.RequireAnyRoleOrPermission([]string{"SuperAdmin", "Admin"}, []string{"hr.employees.write"})(c)
	})
	{
		api.POST("/import/:module/preview", opts.Import.Preview)
		api.POST("/import/:module/confirm", opts.Import.Confirm)

		api.POST("/export/:module", opts.Export.Create)
		api.POST("/reports/:module/export", opts.ReportExport.Export)

		api.GET("/templates/:module/download", opts.Templates.Download)

		api.POST("/company-organogram/import", opts.Organogram.Import)
		api.GET("/company-organogram/demo-format", opts.Organogram.DemoFormat)
		api.GET("/company-organogram/export", opts.Organogram.Export)

		api.POST("/address/import", opts.Address.Import)
		api.GET("/address/demo-format", opts.Address.DemoFormat)

		api.GET("/import-jobs", opts.Jobs.ListImportJobs)
		api.GET("/import-jobs/:id", opts.Jobs.GetImportJob)
		api.GET("/import-jobs/:id/error-file", opts.Jobs.DownloadImportErrorFile)

		api.GET("/export-jobs", opts.Jobs.ListExportJobs)
		api.GET("/export-jobs/:id/download", opts.Jobs.DownloadExportJob)
	}

	return r
}

// NewSwaggerOnly exposes health and Swagger docs when the database is unavailable in local Docker.
func NewSwaggerOnly(allowedOrigins []string) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.TraceID())
	r.Use(corsMiddleware(allowedOrigins))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "unhealthy",
			"service": "ImportExportService",
			"reason":  "database unavailable; Swagger docs are still available",
		})
	})
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/", func(c *gin.Context) { c.Redirect(http.StatusFound, "/swagger/index.html") })

	gatewaySwagger := ginSwagger.WrapHandler(
		swaggerFiles.Handler,
		ginSwagger.URL("/api/v1/import-export/swagger/doc.json"),
	)
	r.GET("/api/v1/import-export/swagger/*any", gatewaySwagger)

	return r
}

func corsMiddleware(origins []string) gin.HandlerFunc {
	cfg := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		AllowCredentials: true,
		MaxAge:           600,
	}
	if len(origins) > 0 {
		cfg.AllowOrigins = origins
	} else {
		cfg.AllowOriginFunc = func(origin string) bool { return true }
	}
	return cors.New(cfg)
}
