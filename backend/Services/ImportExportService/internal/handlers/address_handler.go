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

type AddressHandler struct {
	Svc   *importsvc.Service
	Store storage.LocalStorage
}

// Import godoc
// @Summary      Import address hierarchy from Excel
// @Description  Creates or updates Countries, Divisions, Districts, Thanas/Upazilas, and Post Offices in CompanyServiceDB from an Excel file.
// @Tags         address
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        file  formData  file  true  "Excel (.xlsx) file using the Address demo format"
// @Success      200   {object}  APIResponseAddressImport
// @Failure      400   {object}  APIResponseError
// @Failure      401   {object}  APIResponseError
// @Failure      403   {object}  APIResponseError
// @Router       /api/v1/import-export/address/import [post]
func (h *AddressHandler) Import(c *gin.Context) {
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

	rel, _, _, err := h.Store.Save("address", file.Filename, src)
	if err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("STORAGE", err.Error()))
		return
	}
	result, err := h.Svc.ImportAddress(filepath.Join(h.Store.Root, rel))
	if err != nil {
		response.FailWithStatus(c, http.StatusBadRequest, response.Err("IMPORT", err.Error()))
		return
	}
	response.OK(c, result)
}

// DemoFormat godoc
// @Summary      Download address Excel demo format
// @Description  Downloads an Excel workbook showing how to import Country, Division, District, Thana, Post Office, and Post Code relationships.
// @Tags         address
// @Produce      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Security     BearerAuth
// @Success      200  {file}  binary
// @Failure      401  {object}  APIResponseError
// @Router       /api/v1/import-export/address/demo-format [get]
func (h *AddressHandler) DemoFormat(c *gin.Context) {
	f, err := h.Svc.BuildAddressDemoWorkbook()
	if err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("EXPORT", err.Error()))
		return
	}
	tmp := filepath.Join(os.TempDir(), "address-import-demo.xlsx")
	if err := f.SaveAs(tmp); err != nil {
		response.FailWithStatus(c, http.StatusInternalServerError, response.Err("EXPORT", err.Error()))
		return
	}
	defer os.Remove(tmp)

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=address-import-demo.xlsx")
	c.File(tmp)
}
