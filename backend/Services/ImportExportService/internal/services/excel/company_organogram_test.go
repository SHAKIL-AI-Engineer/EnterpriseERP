package excelsvc

import (
	"archive/zip"
	"io"
	"path/filepath"
	"strings"
	"testing"
)

func TestCompanyOrganogramDemoWorkbookUsesValidFrozenTopRow(t *testing.T) {
	f, err := BuildCompanyOrganogramDemoWorkbook()
	if err != nil {
		t.Fatalf("BuildCompanyOrganogramDemoWorkbook() error = %v", err)
	}
	defer f.Close()

	panes, err := f.GetPanes("CompanyOrganogram")
	if err != nil {
		t.Fatalf("GetPanes() error = %v", err)
	}
	if !panes.Freeze || panes.YSplit != 1 || panes.TopLeftCell != "A2" || panes.ActivePane != "bottomLeft" {
		t.Fatalf("unexpected panes: %+v", panes)
	}
	if len(panes.Selection) != 1 || panes.Selection[0].Pane != "bottomLeft" || panes.Selection[0].ActiveCell != "A2" {
		t.Fatalf("unexpected pane selection: %+v", panes.Selection)
	}

	path := filepath.Join(t.TempDir(), "company-organogram-import-demo.xlsx")
	if err := f.SaveAs(path); err != nil {
		t.Fatalf("SaveAs() error = %v", err)
	}
	sheetXML := readXLSXEntry(t, path, "xl/worksheets/sheet1.xml")
	for _, want := range []string{
		`<pane `,
		`activePane="bottomLeft"`,
		`state="frozen"`,
		`topLeftCell="A2"`,
		`ySplit="1"`,
		`<selection `,
		`activeCell="A2"`,
		`pane="bottomLeft"`,
		`sqref="A2"`,
	} {
		if !strings.Contains(sheetXML, want) {
			t.Fatalf("sheet XML does not contain %q:\n%s", want, sheetXML)
		}
	}
}

func readXLSXEntry(t *testing.T, xlsxPath, entryName string) string {
	t.Helper()

	zr, err := zip.OpenReader(xlsxPath)
	if err != nil {
		t.Fatalf("OpenReader() error = %v", err)
	}
	defer zr.Close()

	for _, file := range zr.File {
		if file.Name != entryName {
			continue
		}
		rc, err := file.Open()
		if err != nil {
			t.Fatalf("Open() error = %v", err)
		}
		defer rc.Close()
		content, err := io.ReadAll(rc)
		if err != nil {
			t.Fatalf("ReadAll() error = %v", err)
		}
		return string(content)
	}
	t.Fatalf("entry %q not found in %s", entryName, xlsxPath)
	return ""
}
