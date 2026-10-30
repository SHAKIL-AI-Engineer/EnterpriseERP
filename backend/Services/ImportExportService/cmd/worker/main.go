package main

import (
	"context"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/enterprise-erp/importexport/internal/config"
	"github.com/enterprise-erp/importexport/internal/database"
	"github.com/enterprise-erp/importexport/internal/jobs"
	"github.com/enterprise-erp/importexport/internal/services/hrclient"
	"github.com/enterprise-erp/importexport/internal/services/importsvc"
	"github.com/enterprise-erp/importexport/internal/storage"
	"github.com/enterprise-erp/importexport/internal/worker"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	cfg, err := config.Load()
	if err != nil {
		logger.Error("config", "error", err)
		os.Exit(1)
	}
	dsn := config.NormalizeSQLServerDSN(cfg.ConnectionStrings.ImportExportDb)
	gdb, err := database.Open(dsn, logger)
	if err != nil {
		logger.Error("db", "error", err)
		os.Exit(1)
	}
	companyDSN := config.NormalizeSQLServerDSN(cfg.ConnectionStrings.CompanyDb)
	companyDB, err := database.Open(companyDSN, logger)
	if err != nil {
		logger.Error("company db", "error", err)
		os.Exit(1)
	}
	dataRoot := filepath.Join(".", "data")
	store := storage.LocalStorage{Root: dataRoot}
	svc := &importsvc.Service{
		DB: gdb, CompanyDB: companyDB, Store: store, ExportDir: cfg.Storage.ExportDir,
		LargeThreshold:                cfg.Asynq.ImportLargeRowThreshold,
		EmployeeImportBatchSize:       cfg.EmployeeImport.BatchSize,
		EmployeeImportParallelBatches: cfg.EmployeeImport.ParallelBatches,
		HR:                            hrclient.New(cfg.Services.HrBaseUrl),
	}
	h := worker.NewHandler(svc, logger)
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: cfg.Redis.Address, Password: cfg.Redis.Password, DB: cfg.Redis.DB},
		asynq.Config{Concurrency: cfg.Asynq.Concurrency},
	)
	mux := asynq.NewServeMux()
	mux.HandleFunc(jobs.TypeImportLarge, func(ctx context.Context, t *asynq.Task) error {
		p, err := jobs.ParseLargeImportPayload(t)
		if err != nil {
			return err
		}
		jobID, err := uuid.Parse(p.ImportJobID)
		if err != nil {
			return err
		}
		sessID, err := uuid.Parse(p.SessionID)
		if err != nil {
			return err
		}
		return h.ProcessLargeImport(ctx, jobID, sessID)
	})
	logger.Info("ImportExport worker starting", "redis", cfg.Redis.Address)
	if err := srv.Run(mux); err != nil {
		logger.Error("worker", "error", err)
		os.Exit(1)
	}
}
