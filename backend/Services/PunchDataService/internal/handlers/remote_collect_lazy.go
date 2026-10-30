package handlers

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"strings"

	"github.com/enterprise-erp/punchdata/internal/collector"
	"github.com/enterprise-erp/punchdata/internal/db"
	"github.com/enterprise-erp/punchdata/internal/events"
	"github.com/enterprise-erp/punchdata/internal/remote"
	"github.com/enterprise-erp/punchdata/internal/repository"
)

// RemoteCollectHandlerConfig wires lazy remote ZKTeco SQL collect (connection opened on first use).
type RemoteCollectHandlerConfig struct {
	Repo          *repository.Repository
	RemoteConnStr string
	Publisher     events.Publisher
	Logger        *slog.Logger
	Options       collector.RemoteOptions
}

func (h *RemoteCollectHandler) configured() bool {
	return strings.TrimSpace(h.remoteConnStr) != ""
}

func (h *RemoteCollectHandler) ensureCollector(ctx context.Context) (*collector.RemoteService, error) {
	if h.collector != nil {
		return h.collector, nil
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.collector != nil {
		return h.collector, nil
	}
	if !h.configured() {
		return nil, fmt.Errorf("RemoteZktecoDb connection string is not configured")
	}
	conn, err := db.OpenRemote(h.remoteConnStr)
	if err != nil {
		return nil, err
	}
	h.remoteSQL = conn
	h.collector = collector.NewRemoteService(
		h.repo,
		remote.NewReader(conn),
		h.publisher,
		h.logger,
		h.remoteOpts,
	)
	if h.logger != nil {
		h.logger.Info("remote ZKTeco collect connected (read-only, lazy)")
	}
	return h.collector, nil
}

// RemoteSQL returns the lazily opened remote DB handle (for health checks), or nil.
func (h *RemoteCollectHandler) RemoteSQL() *sql.DB {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.remoteSQL
}
