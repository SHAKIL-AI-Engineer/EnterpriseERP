package handlers

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/enterprise-erp/importexport/internal/response"
	"github.com/enterprise-erp/importexport/internal/services/importsvc"
	"github.com/enterprise-erp/importexport/internal/storage"
	"github.com/gin-gonic/gin"
)

type CompanyOrganogramHandler struct {
	Svc   *importsvc.Service
	Store storage.LocalStorage
}

// Import godoc
// @Summary      Import company organogram from Excel
// @Description  Creates or updates Companies (when missing), Departments, Sections, Designations, and Lines in CompanyServiceDB from an Excel file.
// @Tags         company-organogram
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        file  formData  file  true  "Excel (.xlsx) file using the Company Organogram demo format"
// @Success      200   {object}  APIResponseCompanyOrganogramImport
// @Failure      400   {object}  APIResponseError
// @Failure      401   {object}  APIResponseError
// @Failure      403   {object}  APIResponseError
// @Router       /api/v1/import-export/company-organogram/import [post]
func (h *CompanyOrganogramHandler) Import(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("FILE", "file is required"))
		return
	}
	if err := storage.ValidateMIME(file.Filename, nil); err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("FILE", err.Error()))
		return
	}
	src, err := file.Open()
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("FILE", err.Error()))
		return
	}
	defer src.Close()

	rel, _, _, err := h.Store.Save("company-organogram", file.Filename, src)
	if err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("STORAGE", err.Error()))
		return
	}
	absPath := filepath.Join(h.Store.Root, rel)
	result, err := h.Svc.ImportCompanyOrganogram(absPath)
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("IMPORT", err.Error()))
		return
	}
	response.OK(c, result)
}

// DemoFormat godoc
// @Summary      Download company organogram Excel demo format
// @Description  Downloads an Excel workbook showing how to import Departments, Sections, Designations, and Lines.
// @Tags         company-organogram
// @Produce      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Security     BearerAuth
// @Success      200  {file}  binary
// @Failure      401  {object}  APIResponseError
// @Router       /api/v1/import-export/company-organogram/demo-format [get]
func (h *CompanyOrganogramHandler) DemoFormat(c *gin.Context) {
	f, err := h.Svc.BuildCompanyOrganogramDemoWorkbook()
	if err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("EXPORT", err.Error()))
		return
	}
	tmp := filepath.Join(os.TempDir(), "company-organogram-import-demo.xlsx")
	if err := f.SaveAs(tmp); err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("EXPORT", err.Error()))
		return
	}
	defer os.Remove(tmp)

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=company-organogram-import-demo.xlsx")
	c.File(tmp)
}

// Export godoc
// @Summary      Export company organogram Excel
// @Description  Exports current Company, Department, Section, Designation, and Line relationships in the same Excel format used for import.
// @Tags         company-organogram
// @Produce      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Security     BearerAuth
// @Param        companyName  query  string  false  "Filter by company English name"
// @Success      200  {file}  binary
// @Failure      401  {object}  APIResponseError
// @Router       /api/v1/import-export/company-organogram/export [get]
func (h *CompanyOrganogramHandler) Export(c *gin.Context) {
	f, err := h.Svc.ExportCompanyOrganogram(c.Query("companyName"))
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("EXPORT", err.Error()))
		return
	}
	tmp := filepath.Join(os.TempDir(), "company-organogram-export.xlsx")
	if err := f.SaveAs(tmp); err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("EXPORT", err.Error()))
		return
	}
	defer os.Remove(tmp)

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=company-organogram-export.xlsx")
	c.File(tmp)
}
