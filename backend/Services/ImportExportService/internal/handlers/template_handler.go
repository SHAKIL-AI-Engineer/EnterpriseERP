package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/enterprise-erp/importexport/internal/services/templatesvc"
	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

type TemplateHandler struct{}

// Download godoc
// @Summary      Download import template
// @Description  Returns an Excel template for employee, attendance, or payroll imports.
// @Tags         templates
// @Produce      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Security     BearerAuth
// @Param        module  path  string  true  "Module name"  Enums(employee, attendance, payroll)
// @Success      200     {file}  binary
// @Failure      400     {object}  APIResponseError
// @Router       /api/v1/import-export/templates/{module}/download [get]
func (h *TemplateHandler) Download(c *gin.Context) {
	module := strings.ToLower(strings.TrimSpace(c.Param("module")))
	var (
		wb       *excelize.File
		fileName string
		err      error
	)
	switch module {
	case "employee", "employees":
		wb, err = templatesvc.BuildEmployeeImportTemplate()
		fileName = "employee_import_template.xlsx"
	case "attendance":
		wb, err = templatesvc.BuildAttendanceImportTemplate()
		fileName = "attendance_import_template.xlsx"
	case "payroll":
		wb, err = templatesvc.BuildPayrollImportTemplate()
		fileName = "payroll_import_template.xlsx"
	default:
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("MODULE", fmt.Sprintf("unknown module: %s", c.Param("module"))))
		return
	}
	if err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("TEMPLATE", err.Error()))
		return
	}
	tmp := filepath.Join(os.TempDir(), fileName)
	if err := wb.SaveAs(tmp); err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("TEMPLATE", err.Error()))
		return
	}
	defer os.Remove(tmp)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.File(tmp)
}
