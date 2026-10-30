package handlers

import (
	"testing"

	"github.com/google/uuid"
)

func TestCompanyIDFromMeta(t *testing.T) {
	id := uuid.MustParse("bcc18de7-7d50-43bd-96da-6e3e8dec3825")
	meta := map[string]string{
		"CompanyId": id.String(),
		"FromDate":  "2026-05-11",
	}
	got := companyIDFromMeta(meta)
	if got != id {
		t.Fatalf("companyIDFromMeta() = %v, want %v", got, id)
	}
}

func TestCompanyIDFromMeta_empty(t *testing.T) {
	if companyIDFromMeta(nil) != uuid.Nil {
		t.Fatal("expected nil uuid")
	}
}
