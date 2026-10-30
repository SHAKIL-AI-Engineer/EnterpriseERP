package processor

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/enterprise-erp/punchdata/internal/timeutil"
	"github.com/google/uuid"
)

// RawPunch is the format produced by parsers before normalisation.
type RawPunch struct {
	PunchNumber string `json:"punchNumber"`
	DeviceID    string `json:"deviceId,omitempty"`
	PunchTime   string `json:"punchTime"`
	Source      string `json:"source,omitempty"`
	CompanyID   *int   `json:"companyId,omitempty"`
}

// BatchPayload is the JSON shape accepted by POST /logs/batch and the JSON
// upload format.
type BatchPayload struct {
	CompanyID *int       `json:"companyId,omitempty"`
	DeviceID  string     `json:"deviceId,omitempty"`
	Source    string     `json:"source,omitempty"`
	Records   []RawPunch `json:"records"`
}

// Parse turns the raw payload bytes into RawPunch rows. Format is auto-detected
// from the contentType; "application/json" or "*.json" is treated as JSON, the
// rest as CSV.
func Parse(contentType, fileName string, payload []byte) (BatchPayload, error) {
	ct := strings.ToLower(strings.TrimSpace(contentType))
	name := strings.ToLower(strings.TrimSpace(fileName))

	if strings.Contains(ct, "json") || strings.HasSuffix(name, ".json") || looksLikeJSON(payload) {
		return parseJSON(payload)
	}
	return parseCSV(payload)
}

func looksLikeJSON(b []byte) bool {
	for _, c := range b {
		switch c {
		case ' ', '\t', '\n', '\r':
			continue
		case '{', '[':
			return true
		default:
			return false
		}
	}
	return false
}

func parseJSON(payload []byte) (BatchPayload, error) {
	dec := json.NewDecoder(bytes.NewReader(payload))
	dec.UseNumber()

	// First try as a BatchPayload.
	var batch BatchPayload
	if err := json.Unmarshal(payload, &batch); err == nil && batch.Records != nil {
		return batch, nil
	}

	// Then try as a bare array of RawPunch rows.
	var rows []RawPunch
	if err := json.Unmarshal(payload, &rows); err == nil {
		return BatchPayload{Records: rows}, nil
	}

	return BatchPayload{}, fmt.Errorf("payload is not a recognised JSON shape (expected {records:[...]} or [...])")
}

func parseCSV(payload []byte) (BatchPayload, error) {
	r := csv.NewReader(bytes.NewReader(payload))
	r.TrimLeadingSpace = true

	headerRow, err := r.Read()
	if err == io.EOF {
		return BatchPayload{}, fmt.Errorf("empty CSV file")
	}
	if err != nil {
		return BatchPayload{}, fmt.Errorf("read header: %w", err)
	}

	headers := normaliseHeaders(headerRow)
	col := map[string]int{}
	for i, h := range headers {
		col[h] = i
	}

	if _, ok := col["punchtime"]; !ok {
		return BatchPayload{}, fmt.Errorf("CSV header missing required column: punchTime")
	}
	if _, ok := col["punchnumber"]; !ok {
		if _, ok := col["employeecode"]; !ok {
			return BatchPayload{}, fmt.Errorf("CSV header missing required column: punchNumber (or legacy employeeCode)")
		}
	}

	rows := []RawPunch{}
	lineNo := 1
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		lineNo++
		if err != nil {
			return BatchPayload{}, fmt.Errorf("line %d: %w", lineNo, err)
		}

		get := func(name string) string {
			i, ok := col[name]
			if !ok || i >= len(row) {
				return ""
			}
			return strings.TrimSpace(row[i])
		}

		punchNum := get("punchnumber")
		if punchNum == "" {
			punchNum = get("employeecode")
		}
		rp := RawPunch{
			PunchNumber: punchNum,
			DeviceID:    get("deviceid"),
			PunchTime:   get("punchtime"),
			Source:      get("source"),
		}
		if v := get("companyid"); v != "" {
			if n, err := strconv.Atoi(v); err == nil {
				rp.CompanyID = &n
			}
		}
		rows = append(rows, rp)
	}

	return BatchPayload{Records: rows}, nil
}

func normaliseHeaders(in []string) []string {
	out := make([]string, len(in))
	for i, h := range in {
		out[i] = strings.ToLower(strings.ReplaceAll(strings.TrimSpace(h), "_", ""))
	}
	return out
}

// Defaults describes fallback values used to fill in missing fields on a row.
type Defaults struct {
	CompanyID int
	DeviceID  string
	Source    string
}

// Normalize converts the parsed batch into PunchRecord rows ready for insert.
// Invalid rows are skipped and their reasons are returned in errors.
func Normalize(ctx context.Context, logID uuid.UUID, batch BatchPayload, def Defaults) ([]models.PunchRecord, []string) {
	_ = ctx

	companyDefault := def.CompanyID
	if batch.CompanyID != nil {
		companyDefault = *batch.CompanyID
	}
	deviceDefault := batch.DeviceID
	if deviceDefault == "" {
		deviceDefault = def.DeviceID
	}
	sourceDefault := batch.Source
	if sourceDefault == "" {
		sourceDefault = def.Source
	}

	out := make([]models.PunchRecord, 0, len(batch.Records))
	errs := []string{}
	now := timeutil.Now()

	for i, r := range batch.Records {
		punchNumber, err := models.ParsePunchNumber(r.PunchNumber)
		if err != nil {
			errs = append(errs, fmt.Sprintf("row %d: %v", i+1, err))
			continue
		}

		pt, err := timeutil.ParsePunchTime(r.PunchTime)
		if err != nil {
			errs = append(errs, fmt.Sprintf("row %d: invalid punchTime %q (%v)", i+1, r.PunchTime, err))
			continue
		}

		company := companyDefault
		if r.CompanyID != nil && *r.CompanyID > 0 {
			company = *r.CompanyID
		}

		device := strings.TrimSpace(r.DeviceID)
		if device == "" {
			device = deviceDefault
		}

		source := strings.TrimSpace(r.Source)
		if source == "" {
			source = sourceDefault
		}

		out = append(out, models.PunchRecord{
			ID:          uuid.New(),
			LogFileID:   logID,
			CompanyID:   company,
			PunchNumber: punchNumber,
			DeviceID:    device,
			PunchTime:   pt,
			Source:      source,
			CreatedAt:   now,
		})
	}

	return out, errs
}
