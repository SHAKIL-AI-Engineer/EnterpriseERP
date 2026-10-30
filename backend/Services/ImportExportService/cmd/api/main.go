package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/enterprise-erp/importexport/internal/config"
	"github.com/enterprise-erp/importexport/internal/database"
	_ "github.com/enterprise-erp/importexport/internal/docs"
	"github.com/enterprise-erp/importexport/internal/handlers"
	"github.com/enterprise-erp/importexport/internal/middleware"
	"github.com/enterprise-erp/importexport/internal/router"
	"github.com/enterprise-erp/importexport/internal/services/hrclient"
	"github.com/enterprise-erp/importexport/internal/services/importsvc"
	"github.com/enterprise-erp/importexport/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
)

// @title           ImportExportService API
// @version         1.0
// @description     Bulk import/export microservice for EnterpriseERP (Excel, CSV). Supports preview/confirm import, templates, and job history.
// @contact.name    EnterpriseERP Platform Team
// @BasePath        /
// @schemes         http https
//
// @securityDefinitions.apikey  BearerAuth
// @in                          header
// @name                        Authorization
// @description                 JWT from AuthService. Format: Bearer <token> (requires companyId claim).
func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		logger.Error("load config", "error", err)
		os.Exit(1)
	}
	if strings.TrimSpace(cfg.Jwt.SigningKey) == "" || len(cfg.Jwt.SigningKey) < 32 {
		logger.Error("Jwt.SigningKey must be set (match AuthService)")
		os.Exit(1)
	}
	if strings.TrimSpace(cfg.ConnectionStrings.ImportExportDb) == "" {
		logger.Error("ConnectionStrings.ImportExportDb is required")
		os.Exit(1)
	}
	if strings.TrimSpace(cfg.ConnectionStrings.CompanyDb) == "" {
		logger.Error("ConnectionStrings.CompanyDb is required")
		os.Exit(1)
	}

	dsn := config.NormalizeSQLServerDSN(cfg.ConnectionStrings.ImportExportDb)
	gdb, err := database.Open(dsn, logger)
	if err != nil {
		if strings.EqualFold(os.Getenv("IMPORTEXPORT_SWAGGER_ONLY_ON_DB_FAILURE"), "true") {
			logger.Warn("db open failed; starting ImportExportService in Swagger-only mode", "error", err)
			if os.Getenv("GIN_MODE") == "" {
				gin.SetMode(gin.ReleaseMode)
			}
			runSwaggerOnlyServer(cfg.Server.Address, router.NewSwaggerOnly(cfg.Cors.AllowedOrigins), logger)
			return
		}
		logger.Error("db open", "error", err)
		os.Exit(1)
	}
	if err := database.AutoMigrate(gdb); err != nil {
		logger.Error("db migrate", "error", err)
		os.Exit(1)
	}
	companyDSN := config.NormalizeSQLServerDSN(cfg.ConnectionStrings.CompanyDb)
	companyDB, err := database.Open(companyDSN, logger)
	if err != nil {
		logger.Error("company db open", "error", err)
		os.Exit(1)
	}

	dataRoot := filepath.Join(mustWd(), "data")
	uploadRoot := filepath.Join(dataRoot, cfg.Storage.UploadDir)
	_ = os.MkdirAll(uploadRoot, 0o750)
	_ = os.MkdirAll(filepath.Join(dataRoot, cfg.Storage.ExportDir), 0o750)

	var asynqClient *asynq.Client
	if cfg.Redis.Address != "" {
		asynqClient = asynq.NewClient(asynq.RedisClientOpt{
			Addr:     cfg.Redis.Address,
			Password: cfg.Redis.Password,
			DB:       cfg.Redis.DB,
		})
		defer asynqClient.Close()
	}

	store := storage.LocalStorage{Root: dataRoot}
	svc := &importsvc.Service{
		DB:                            gdb,
		CompanyDB:                     companyDB,
		Store:                         store,
		ExportDir:                     cfg.Storage.ExportDir,
		LargeThreshold:                cfg.Asynq.ImportLargeRowThreshold,
		EmployeeImportBatchSize:       cfg.EmployeeImport.BatchSize,
		EmployeeImportParallelBatches: cfg.EmployeeImport.ParallelBatches,
		AsynqClient:                   asynqClient,
		HR:                            hrclient.New(cfg.Services.HrBaseUrl),
	}

	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := router.New(router.Options{
		AllowedOrigins: cfg.Cors.AllowedOrigins,
		Jwt: middleware.JwtConfig{
			Issuer: cfg.Jwt.Issuer, Audience: cfg.Jwt.Audience, SigningKey: cfg.Jwt.SigningKey,
		},
		Health:       handlers.NewHealthHandler(gdb),
		Import:       &handlers.ImportHandler{Svc: svc, Store: store},
		Export:       &handlers.ExportHandler{Svc: svc},
		Organogram:   &handlers.CompanyOrganogramHandler{Svc: svc, Store: store},
		Address:      &handlers.AddressHandler{Svc: svc, Store: store},
		Jobs:         &handlers.JobsHandler{Svc: svc},
		Templates:    &handlers.TemplateHandler{},
		ReportExport: &handlers.ReportExportHandler{CompanyDB: companyDB},
	})

	srv := &http.Server{
		Addr:              cfg.Server.Address,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Info("ImportExportService listening", "address", cfg.Server.Address)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	if sqlDB, err := gdb.DB(); err == nil {
		_ = sqlDB.Close()
	}
	if sqlDB, err := companyDB.DB(); err == nil {
		_ = sqlDB.Close()
	}
}

func mustWd() string {
	wd, err := os.Getwd()
	if err != nil {
		return "."
	}
	return wd
}

func runSwaggerOnlyServer(address string, engine *gin.Engine, logger *slog.Logger) {
	srv := &http.Server{
		Addr:              address,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Info("ImportExportService Swagger-only listener started", "address", address)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}
