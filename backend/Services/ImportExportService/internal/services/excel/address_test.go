package excelsvc

import (
	"path/filepath"
	"testing"
)

func TestAddressDemoWorkbookCanBeParsed(t *testing.T) {
	f, err := BuildAddressDemoWorkbook()
	if err != nil {
		t.Fatalf("BuildAddressDemoWorkbook() error = %v", err)
	}
	defer f.Close()

	panes, err := f.GetPanes("Address")
	if err != nil {
		t.Fatalf("GetPanes() error = %v", err)
	}
	if !panes.Freeze || panes.YSplit != 1 || panes.TopLeftCell != "A2" {
		t.Fatalf("unexpected panes: %+v", panes)
	}

	path := filepath.Join(t.TempDir(), "address-import-demo.xlsx")
	if err := f.SaveAs(path); err != nil {
		t.Fatalf("SaveAs() error = %v", err)
	}

	rows, errs, err := ParseAddressImport(path)
	if err != nil {
		t.Fatalf("ParseAddressImport() error = %v", err)
	}
	if len(errs) != 0 {
		t.Fatalf("ParseAddressImport() row errors = %+v", errs)
	}
	if len(rows) != 2 {
		t.Fatalf("ParseAddressImport() rows = %d, want 2", len(rows))
	}
	if rows[0].CountryNameEn != "Bangladesh" || rows[0].ThanaNameEn != "Motijheel" || rows[0].PostCode != "1000" {
		t.Fatalf("unexpected first row: %+v", rows[0])
	}
}
