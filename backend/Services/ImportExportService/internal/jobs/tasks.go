package jobs

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TypeImportLarge = "import:large"
)

type LargeImportPayload struct {
	ImportJobID string `json:"importJobId"`
	SessionID   string `json:"sessionId"`
}

func NewLargeImportTask(p LargeImportPayload) (*asynq.Task, error) {
	body, err := json.Marshal(p)
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeImportLarge, body), nil
}

func ParseLargeImportPayload(t *asynq.Task) (LargeImportPayload, error) {
	var p LargeImportPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return p, fmt.Errorf("json: %w", err)
	}
	return p, nil
}
