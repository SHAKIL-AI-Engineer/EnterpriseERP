// One-off: go run ./cmd/gen-organogram-demo
package main

import (
	"fmt"
	"os"
	"path/filepath"

	excelsvc "github.com/enterprise-erp/importexport/internal/services/excel"
)

func main() {
	f, err := excelsvc.BuildCompanyOrganogramDemoWorkbook()
	if err != nil {
		panic(err)
	}
	defer f.Close()

	root := filepath.Clean(filepath.Join(filepath.Dir(os.Args[0]), "..", ".."))
	if _, err := os.Stat(filepath.Join(root, "go.mod")); err != nil {
		root, _ = os.Getwd()
	}
	out := filepath.Join(root, "templates", "company-organogram-import-demo.xlsx")
	if err := os.MkdirAll(filepath.Dir(out), 0o755); err != nil {
		panic(err)
	}
	if err := f.SaveAs(out); err != nil {
		panic(err)
	}
	fmt.Println("wrote", out)
}
