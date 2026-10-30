package worker

import (
	"context"
	"log/slog"

	"github.com/enterprise-erp/importexport/internal/services/importsvc"
	"github.com/google/uuid"
)

type Handler struct {
	Svc *importsvc.Service
	Log *slog.Logger
}

func NewHandler(svc *importsvc.Service, log *slog.Logger) *Handler {
	return &Handler{Svc: svc, Log: log}
}

func (h *Handler) ProcessLargeImport(_ context.Context, jobID, sessionID uuid.UUID) error {
	if h.Log != nil {
		h.Log.Info("processing large import", "jobId", jobID, "sessionId", sessionID)
	}
	return h.Svc.ProcessLargeImport(jobID, sessionID)
}
