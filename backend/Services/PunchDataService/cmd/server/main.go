package main

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/enterprise-erp/punchdata/internal/collector"
	"github.com/enterprise-erp/punchdata/internal/config"
	"github.com/enterprise-erp/punchdata/internal/db"
	"github.com/enterprise-erp/punchdata/internal/devices/zkteco"
	_ "github.com/enterprise-erp/punchdata/internal/docs"
	"github.com/enterprise-erp/punchdata/internal/events"
	"github.com/enterprise-erp/punchdata/internal/handlers"
	"github.com/enterprise-erp/punchdata/internal/middleware"
	"github.com/enterprise-erp/punchdata/internal/processor"
	"github.com/enterprise-erp/punchdata/internal/remote"
	"github.com/enterprise-erp/punchdata/internal/repository"
	"github.com/enterprise-erp/punchdata/internal/router"
	"github.com/enterprise-erp/punchdata/internal/sync"
	"github.com/gin-gonic/gin"
)

// @title           PunchDataService API
// @version         1.0
// @description     Collects raw punch logs from biometric devices, file uploads, manual entry, and read-only import from a public ZKTeco SQL Server. Stores normalised rows in PunchRecords with deduplication. Does not calculate attendance (see AttendanceService).
// @contact.name    EnterpriseERP Platform Team
// @BasePath        /
// @schemes         http https
//
// @tag.name        health
// @tag.description Liveness and database connectivity
// @tag.name        logs
// @tag.description Upload, batch ingest, and process raw punch payloads
// @tag.name        punches
// @tag.description Query and manually add normalised punch records
// @tag.name        machines
// @tag.description ZKTeco device registry, connectivity test, and LAN sync
// @tag.name        imports
// @tag.description CSV/Excel import batch history and row errors
// @tag.name        remote-collect
// @tag.description Read-only collect from public ZKTeco SQL (CHECKINOUT) into PunchRecords
//
// @securityDefinitions.apikey  BearerAuth
// @in                          header
// @name                        Authorization
// @description                 JWT issued by AuthService. Send as: `Bearer <token>`. Pass companyId in body or query when needed.

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		logger.Error("load config failed", "error", err)
		os.Exit(1)
	}

	if strings.TrimSpace(cfg.Jwt.SigningKey) == "" || len(cfg.Jwt.SigningKey) < 32 {
		logger.Error("Jwt.SigningKey must be set and at least 32 chars (match AuthService)")
		os.Exit(1)
	}

	gormDB, err := db.Open(cfg.ConnectionStrings.PunchDataDb, logger)
	if err != nil {
		if strings.EqualFold(os.Getenv("PUNCHDATA_SWAGGER_ONLY_ON_DB_FAILURE"), "true") {
			logger.Warn("db open failed; starting PunchDataService in Swagger-only mode", "error", err)
			if os.Getenv("GIN_MODE") == "" {
				gin.SetMode(gin.ReleaseMode)
			}
			runSwaggerOnlyServer(cfg.Server.Address, router.NewSwaggerOnly(cfg.Cors.AllowedOrigins), logger)
			return
		}
		logger.Error("db open failed", "error", err)
		os.Exit(1)
	}
	if err := db.AutoMigrate(gormDB); err != nil {
		logger.Error("db migrate failed", "error", err)
		os.Exit(1)
	}

	var publisher events.Publisher = events.NoopPublisher{}
	var rabbitCloser *events.RabbitPublisher
	if cfg.RabbitMQ.Enabled {
		rabbitCloser = events.NewRabbitPublisher(events.RabbitMQConfig{
			HostName:     cfg.RabbitMQ.HostName,
			UserName:     cfg.RabbitMQ.UserName,
			Password:     cfg.RabbitMQ.Password,
			ExchangeName: cfg.RabbitMQ.ExchangeName,
		}, logger)
		publisher = rabbitCloser
	}

	repo := repository.New(gormDB)
	procSvc := processor.NewService(repo, logger, publisher, cfg.PunchData.Source)
	zkClient := zkteco.NewClient("", 0)

	var remoteSQL *sql.DB
	var remoteColSvc *collector.RemoteService
	remoteConfigured := strings.TrimSpace(cfg.ConnectionStrings.RemoteZktecoDb) != ""
	if src := cfg.ConnectionStringsSource(); src != "" {
		logger.Info("merged connection strings", "file", src)
	}
	if remoteConfigured {
		logger.Info("remote ZKTeco SQL configured", "database", "zkteco")
	} else {
		logger.Warn("RemoteZktecoDb is empty; set it in appsettings.Development.json or backend/Configuration/connectionstrings.json, then restart PunchDataService")
	}
	if remoteConfigured {
		remoteSQL, err = db.OpenRemote(cfg.ConnectionStrings.RemoteZktecoDb)
		if err != nil {
			logger.Warn("remote ZKTeco startup ping failed; collect will retry on first request", "error", err)
		} else {
			remoteColSvc = collector.NewRemoteService(
				repo,
				remote.NewReader(remoteSQL),
				publisher,
				logger,
				collector.RemoteOptions{
					Source:              cfg.RemoteCollect.Source,
					PageSize:            cfg.RemoteCollect.DefaultBatchSize,
					MaxPageSize:         cfg.RemoteCollect.MaxBatchSize,
					MaxRowsPerCollect:   cfg.RemoteCollect.MaxRowsPerCollect,
					DefaultLookbackDays: cfg.RemoteCollect.DefaultLookbackDays,
				},
			)
			logger.Info("remote ZKTeco collect enabled (read-only)")
		}
	}

	var syncSvc *sync.Service
	if remoteColSvc != nil {
		syncSvc = sync.NewServiceWithRemote(repo, procSvc, zkClient, remoteColSvc, cfg.RemoteCollect.DefaultLookbackDays)
	} else {
		syncSvc = sync.NewService(repo, procSvc, zkClient)
	}

	localMdbConfigured := strings.TrimSpace(cfg.ConnectionStrings.LocalZktecoMdbPath) != ""
	if localMdbConfigured {
		logger.Info("local ZKTeco MDB configured", "path", cfg.ConnectionStrings.LocalZktecoMdbPath)
	} else {
		logger.Warn("ConnectionStrings.LocalZktecoMdbPath is empty; set it in backend/Configuration/connectionstrings.json, then restart PunchDataService to enable local collect")
	}

	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := router.New(router.Options{
		AllowedOrigins: cfg.Cors.AllowedOrigins,
		Jwt: middleware.JwtConfig{
			Issuer:     cfg.Jwt.Issuer,
			Audience:   cfg.Jwt.Audience,
			SigningKey: cfg.Jwt.SigningKey,
		},
		Health:   handlers.NewHealthHandler(gormDB, remoteSQL),
		Logs:     handlers.NewLogsHandler(repo, procSvc, cfg.PunchData.MaxUploadMB),
		Punches:  handlers.NewPunchesHandler(repo, procSvc),
		Machines: handlers.NewMachinesHandler(repo, zkClient, syncSvc),
		Imports:  handlers.NewImportsHandler(repo),
		RemoteCollect: handlers.NewRemoteCollectHandler(handlers.RemoteCollectHandlerConfig{
			Repo:          repo,
			RemoteConnStr: cfg.ConnectionStrings.RemoteZktecoDb,
			Publisher:     publisher,
			Logger:        logger,
			Options: collector.RemoteOptions{
				Source:              cfg.RemoteCollect.Source,
				PageSize:            cfg.RemoteCollect.DefaultBatchSize,
				MaxPageSize:         cfg.RemoteCollect.MaxBatchSize,
				MaxRowsPerCollect:   cfg.RemoteCollect.MaxRowsPerCollect,
				DefaultLookbackDays: cfg.RemoteCollect.DefaultLookbackDays,
			},
		}, remoteColSvc),
		LocalCollect: handlers.NewLocalCollectHandler(handlers.LocalCollectHandlerConfig{
			Repo:      repo,
			MdbPath:   cfg.ConnectionStrings.LocalZktecoMdbPath,
			Publisher: publisher,
			Logger:    logger,
			Options: collector.LocalOptions{
				Source:              cfg.LocalCollect.Source,
				PageSize:            cfg.LocalCollect.DefaultBatchSize,
				MaxPageSize:         cfg.LocalCollect.MaxBatchSize,
				MaxRowsPerCollect:   cfg.LocalCollect.MaxRowsPerCollect,
				DefaultLookbackDays: cfg.LocalCollect.DefaultLookbackDays,
			},
		}),
	})

	srv := &http.Server{
		Addr:              cfg.Server.Address,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if cfg.PunchData.EnableBackgroundSync {
		interval := time.Duration(cfg.PunchData.SyncIntervalMinutes) * time.Minute
		go sync.NewScheduler(repo, syncSvc, logger, interval).Run(ctx)
		logger.Info("background device sync enabled", "interval", interval.String())
	}

	go func() {
		logger.Info("PunchDataService listening", "address", cfg.Server.Address)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	logger.Info("PunchDataService ready", "address", cfg.Server.Address, "hint", "Ctrl+C to stop")
	<-stop

	logger.Info("shutting down")
	cancel()
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Warn("graceful shutdown failed", "error", err)
	}
	if rabbitCloser != nil {
		_ = rabbitCloser.Close()
	}
	if sqlDB, err := gormDB.DB(); err == nil {
		_ = sqlDB.Close()
	}
	if remoteSQL != nil {
		_ = remoteSQL.Close()
	}
}

func runSwaggerOnlyServer(address string, engine *gin.Engine, logger *slog.Logger) {
	srv := &http.Server{
		Addr:              address,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Info("PunchDataService Swagger-only listener started", "address", address)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Warn("graceful shutdown failed", "error", err)
	}
}
