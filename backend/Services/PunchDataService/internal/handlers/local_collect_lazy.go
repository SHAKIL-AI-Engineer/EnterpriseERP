package handlers

import (
	"fmt"
	"log/slog"
	"strings"

	"github.com/enterprise-erp/punchdata/internal/collector"
	"github.com/enterprise-erp/punchdata/internal/events"
	"github.com/enterprise-erp/punchdata/internal/local"
	"github.com/enterprise-erp/punchdata/internal/repository"
)

// LocalCollectHandlerConfig wires lazy local ZKTeco MDB collect (connection opened on first use).
type LocalCollectHandlerConfig struct {
	Repo      *repository.Repository
	MdbPath   string
	Publisher events.Publisher
	Logger    *slog.Logger
	Options   collector.LocalOptions
}

func (h *LocalCollectHandler) configured() bool {
	return strings.TrimSpace(h.mdbPath) != ""
}

func (h *LocalCollectHandler) ensureCollector() (*collector.LocalService, error) {
	if h.col != nil {
		return h.col, nil
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.col != nil {
		return h.col, nil
	}
	if !h.configured() {
		return nil, fmt.Errorf("LocalZktecoMdbPath is not configured")
	}
	h.col = collector.NewLocalService(
		h.repo,
		func() (*local.Session, error) {
			return local.OpenSession(h.mdbPath, h.logger)
		},
		h.publisher,
		h.logger,
		h.opts,
	)
	if h.logger != nil {
		h.logger.Info("local ZKTeco MDB collect enabled (read-only, lazy)", "path", h.mdbPath)
	}
	return h.col, nil
}

// MdbPath returns the configured local MDB path.
func (h *LocalCollectHandler) MdbPath() string {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.mdbPath
}