package handlers

import "time"

// remoteCollectPreviewResponse is the Swagger model for GET /remote/collect/preview.
type remoteCollectPreviewResponse struct {
	From           time.Time `json:"from"`
	To             time.Time `json:"to"`
	RemoteRows     int64     `json:"remoteRows"`
	UnmappedRemote int64     `json:"unmappedRemote"`
	ReadOnly       bool      `json:"readOnly"`
}
