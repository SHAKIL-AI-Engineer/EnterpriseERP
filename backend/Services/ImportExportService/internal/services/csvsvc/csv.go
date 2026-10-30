package csvsvc

import (
	"encoding/csv"
	"os"
	"strconv"

	"github.com/enterprise-erp/importexport/internal/dto"
)

// WriteEmployeeErrorCSV writes row-level import errors as UTF-8 CSV.
func WriteEmployeeErrorCSV(path string, errors []dto.RowError) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	if _, err := f.WriteString("\ufeff"); err != nil {
		return err
	}
	w := csv.NewWriter(f)
	defer w.Flush()
	if err := w.Write([]string{"Row", "Column", "Message"}); err != nil {
		return err
	}
	for _, e := range errors {
		_ = w.Write([]string{strconv.Itoa(e.Row), e.Column, e.Message})
	}
	return w.Error()
}

// WriteRows writes headers + rows with BOM.
func WriteRows(path string, headers []string, rows [][]string) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	if _, err := f.WriteString("\ufeff"); err != nil {
		return err
	}
	w := csv.NewWriter(f)
	defer w.Flush()
	if err := w.Write(headers); err != nil {
		return err
	}
	for _, r := range rows {
		if err := w.Write(r); err != nil {
			return err
		}
	}
	return w.Error()
}
