package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"notificationservice/internal/config"
	"notificationservice/internal/db"
	"notificationservice/internal/handlers"
	"notificationservice/internal/middleware"
	"notificationservice/internal/repository"
	"notificationservice/internal/sse"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	database, err := db.Open(cfg.ConnectionString)
	if err != nil {
		log.Fatalf("database connection error: %v", err)
	}

	if cfg.Database.AutoMigrate {
		if err := db.Migrate(database); err != nil {
			log.Fatalf("database migration error: %v", err)
		}
		log.Println("Database migration completed")
	}

	hub := sse.Default

	notifRepo := repository.New(database)
	tmplRepo := repository.NewTemplates(database)

	notifHandler := handlers.NewNotificationHandler(notifRepo, hub)
	tmplHandler := handlers.NewTemplateHandler(tmplRepo)
	streamHandler := handlers.NewStreamHandler(hub)

	r := gin.Default()

	// CORS — allow same origins as Platform.Host
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", c.GetHeader("Origin"))
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Company-Id, X-Tenant-Id")
		c.Header("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Health endpoint (public)
	r.GET("/health", func(c *gin.Context) {
		sqlDB, err := database.DB()
		if err != nil || sqlDB.Ping() != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "NotificationService",
			"port":    cfg.Port,
		})
	})

	auth := middleware.JWTAuth(cfg.Jwt.SigningKey, cfg.Jwt.Issuer, cfg.Jwt.Audience)

	v1 := r.Group("/api/v1/notification", auth)
	{
		v1.POST("/send", notifHandler.Send)
		v1.GET("/recipient/:recipientId", notifHandler.ListByRecipient)
		v1.PUT("/:id/read", notifHandler.MarkRead)
		v1.DELETE("/:id", notifHandler.Delete)
		v1.GET("/unread-count/:recipientId", notifHandler.UnreadCount)

		// SSE — real-time stream
		v1.GET("/stream/:recipientId", streamHandler.Stream)

		// Templates
		v1.GET("/templates", tmplHandler.List)
		v1.GET("/templates/:id", tmplHandler.GetByID)
		v1.POST("/templates", tmplHandler.Create)
	}

	addr := fmt.Sprintf("0.0.0.0:%s", cfg.Port)
	log.Printf("NotificationService (Go/Gin) listening on http://%s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
