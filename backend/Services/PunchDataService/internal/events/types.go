package events

import (
	"time"

	"github.com/google/uuid"
)

const PunchLogCollected = "erp.punch.log.collected.v1"

// PunchLogCollectedPayload is published when a new raw punch row is stored.
// Attendance calculation is handled by AttendanceService.
type PunchLogCollectedPayload struct {
	EventID      uuid.UUID `json:"eventId"`
	OccurredOn   time.Time `json:"occurredOn"`
	CompanyID    int       `json:"companyId"`
	PunchID      uuid.UUID `json:"punchId"`
	LogFileID    uuid.UUID `json:"logFileId"`
	PunchNumber int       `json:"punchNumber"`
	DeviceID     string    `json:"deviceId"`
	PunchTime    time.Time `json:"punchTime"`
	Source       string    `json:"source"`
}
