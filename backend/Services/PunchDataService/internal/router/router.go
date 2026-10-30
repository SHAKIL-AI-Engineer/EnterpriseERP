package router

import (
	"net/http"

	"github.com/enterprise-erp/punchdata/internal/handlers"
	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Options bundles everything the router needs from main.
type Options struct {
	AllowedOrigins []string
	Jwt            middleware.JwtConfig
	Health         *handlers.HealthHandler
	Logs           *handlers.LogsHandler
	Punches        *handlers.PunchesHandler
	Machines       *handlers.MachinesHandler
	Imports        *handlers.ImportsHandler
	RemoteCollect  *handlers.RemoteCollectHandler
	LocalCollect   *handlers.LocalCollectHandler
}

// New builds a Gin engine wired with middleware, health, and punch-data routes.
func New(opts Options) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CorrelationID())
	r.Use(corsMiddleware(opts.AllowedOrigins))

	r.GET("/health", opts.Health.Get)
	r.GET("/api/v1/punch-data/health", opts.Health.Get)
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/", func(c *gin.Context) { c.Redirect(302, "/swagger/index.html") })

	gatewaySwagger := ginSwagger.WrapHandler(
		swaggerFiles.Handler,
		ginSwagger.URL("/api/v1/punch-data/swagger/doc.json"),
	)
	r.GET("/api/v1/punch-data/swagger/*any", gatewaySwagger)

	api := r.Group("/api/v1/punch-data")
	api.Use(middleware.JWTAuth(opts.Jwt))
	api.Use(middleware.SessionActive())
	api.Use(middleware.CompanyScope())
	api.Use(middleware.FeatureAccess())
	{
		logs := api.Group("/logs")
		{
			logs.POST("/upload", opts.Logs.Upload)
			logs.POST("/batch", opts.Logs.Batch)
			logs.GET("", opts.Logs.List)
			logs.GET("/:id", opts.Logs.Get)
			logs.GET("/:id/download", opts.Logs.Download)
			logs.GET("/:id/records", opts.Punches.ListForLog)
			logs.POST("/:id/process", opts.Logs.ProcessOne)
		}

		api.POST("/process", opts.Logs.ProcessAll)
		api.GET("/punches", opts.Punches.List)
		api.POST("/punches/manual", opts.Punches.Manual)

		machines := api.Group("/machines")
		{
			machines.POST("", opts.Machines.Create)
			machines.POST("/bulk", opts.Machines.Bulk)
			machines.GET("", opts.Machines.List)
			machines.POST("/:id/connect", opts.Machines.Connect)
			machines.POST("/:id/sync", opts.Machines.Sync)
		}

		api.GET("/sync-histories", opts.Machines.ListSyncHistory)

		imports := api.Group("/imports")
		{
			imports.GET("", opts.Imports.ListBatches)
			imports.GET("/:id/errors", opts.Imports.ListErrors)
		}

		if opts.RemoteCollect != nil {
			remote := api.Group("/remote")
			{
				remote.GET("/collect/status", opts.RemoteCollect.Status)
				remote.POST("/collect", opts.RemoteCollect.Collect)
				remote.GET("/collect/preview", opts.RemoteCollect.Preview)
				remote.GET("/collect/histories", opts.RemoteCollect.ListHistories)
			}
		}

		if opts.LocalCollect != nil {
			localGroup := api.Group("/local")
			{
				localGroup.GET("/collect/status", opts.LocalCollect.Status)
				localGroup.POST("/collect", opts.LocalCollect.Collect)
				localGroup.GET("/collect/preview", opts.LocalCollect.Preview)
				localGroup.GET("/collect/histories", opts.LocalCollect.ListHistories)
			}
		}
	}

	return r
}

// NewSwaggerOnly exposes health and Swagger docs when the database is unavailable in local Docker.
func NewSwaggerOnly(allowedOrigins []string) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CorrelationID())
	r.Use(corsMiddleware(allowedOrigins))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "unhealthy",
			"service": "PunchDataService",
			"reason":  "database unavailable; Swagger docs are still available",
		})
	})
	r.GET("/api/v1/punch-data/health", func(c *gin.Context) {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "unhealthy",
			"service": "PunchDataService",
			"reason":  "database unavailable; Swagger docs are still available",
		})
	})
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/", func(c *gin.Context) { c.Redirect(http.StatusFound, "/swagger/index.html") })

	gatewaySwagger := ginSwagger.WrapHandler(
		swaggerFiles.Handler,
		ginSwagger.URL("/api/v1/punch-data/swagger/doc.json"),
	)
	r.GET("/api/v1/punch-data/swagger/*any", gatewaySwagger)

	return r
}

func corsMiddleware(origins []string) gin.HandlerFunc {
	cfg := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"X-Correlation-Id"},
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
