package db

import (
	"fmt"
	"log"
	"strings"

	_ "github.com/microsoft/go-mssqldb/namedpipe"
	_ "github.com/microsoft/go-mssqldb/sharedmemory"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"notificationservice/internal/config"
	"notificationservice/internal/models"
)

func Open(connectionString string) (*gorm.DB, error) {
	if strings.TrimSpace(connectionString) == "" {
		return nil, fmt.Errorf("connection string is empty — check ERP_CONNECTIONSTRINGS or NOTIFICATION_DB_CONNECTION")
	}

	candidates := config.ConnectionStringCandidates(connectionString)
	var lastErr error
	for i, candidate := range candidates {
		gdb, err := gorm.Open(sqlserver.Open(candidate), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if err == nil {
			if i > 0 {
				log.Printf("NotificationService connected using alternate SQL DSN (attempt %d)", i+1)
			}
			return gdb, nil
		}
		lastErr = err
	}
	if lastErr != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", lastErr)
	}
	return nil, fmt.Errorf("no connection string candidates")
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.Notification{},
		&models.NotificationTemplate{},
	)
}
