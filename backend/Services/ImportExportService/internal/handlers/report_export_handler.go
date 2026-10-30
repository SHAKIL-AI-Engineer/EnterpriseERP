package handlers



import (

	"fmt"

	"net/http"

	"strings"



	"github.com/enterprise-erp/importexport/internal/middleware"

	"github.com/enterprise-erp/importexport/internal/response"

	"github.com/enterprise-erp/importexport/internal/services/companylookup"

	reportexport "github.com/enterprise-erp/importexport/internal/services/reportexport"

	"github.com/gin-gonic/gin"

	"github.com/google/uuid"

	"gorm.io/gorm"

)



type ReportExportHandler struct {

	CompanyDB *gorm.DB

}



type ReportExportGroup struct {

	Label string     `json:"label"`

	Rows  [][]string `json:"rows"`

}



type ReportExportSheet struct {

	SheetName   string              `json:"sheetName"`

	SheetTitle  string              `json:"sheetTitle"`

	HeaderColor string              `json:"headerColor"`

	Columns     []string            `json:"columns"`

	Groups      []ReportExportGroup `json:"groups"`

}



type ReportExportRequest struct {

	Title   string              `json:"title" binding:"required"`

	Format  string              `json:"format" binding:"required" example:"Excel"`

	Columns []string            `json:"columns"`

	Rows    [][]string          `json:"rows"`

	Meta    map[string]string   `json:"meta"`

	Sheets  []ReportExportSheet `json:"sheets"`

}



func (h *ReportExportHandler) Export(c *gin.Context) {

	var req ReportExportRequest

	if err := c.ShouldBindJSON(&req); err != nil {

		response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", err.Error()))

		return

	}



	letterhead := h.resolveLetterhead(c, req.Title, req.Meta)

	format := strings.ToLower(strings.TrimSpace(req.Format))



	switch format {

	case "excel", "xlsx":

		h.exportExcel(c, letterhead, req)

	case "pdf":

		h.exportPDF(c, letterhead, req)

	default:

		response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", "format must be Excel or PDF"))

	}

}



func (h *ReportExportHandler) exportExcel(c *gin.Context, letterhead reportexport.ReportLetterhead, req ReportExportRequest) {

	if len(req.Sheets) > 0 {

		sheets := make([]reportexport.WorkbookSheet, 0, len(req.Sheets))

		rowCount := 0

		for _, sheet := range req.Sheets {

			spec := reportexport.WorkbookSheet{

				Name:        sheet.SheetName,

				Title:       sheet.SheetTitle,

				HeaderColor: sheet.HeaderColor,

				Columns:     sheet.Columns,

			}

			for _, group := range sheet.Groups {

				spec.Groups = append(spec.Groups, reportexport.WorkbookGroup{

					Label: group.Label,

					Rows:  group.Rows,

				})

				rowCount += len(group.Rows)

			}

			sheets = append(sheets, spec)

		}

		if rowCount > reportexport.DefaultMaxRows {

			response.FailWithStatus(c, http.StatusRequestEntityTooLarge, response.Err("REPORT_EXPORT",

				fmt.Sprintf("row count %d exceeds limit %d; narrow filters or use async export", rowCount, reportexport.DefaultMaxRows)))

			return

		}

		bytes, err := reportexport.BuildXLSXWorkbook(letterhead, sheets, req.Meta)

		if err != nil {

			response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", err.Error()))

			return

		}

		c.Header("X-Export-Row-Count", fmt.Sprintf("%d", rowCount))

		c.Header("X-Export-Layout", "workbook-v1")

		c.Header("X-Export-Sheet-Count", fmt.Sprintf("%d", len(sheets)))

		c.Header("Content-Disposition", "attachment; filename="+reportexport.SafeFileName(req.Title)+".xlsx")

		c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes)

		return

	}



	if len(req.Columns) == 0 {

		response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", "columns are required when sheets are not provided"))

		return

	}

	rowCount := len(req.Rows)

	if rowCount > reportexport.DefaultMaxRows {

		response.FailWithStatus(c, http.StatusRequestEntityTooLarge, response.Err("REPORT_EXPORT",

			fmt.Sprintf("row count %d exceeds limit %d; narrow filters or use async export", rowCount, reportexport.DefaultMaxRows)))

		return

	}

	bytes, err := reportexport.BuildXLSX(letterhead, req.Columns, req.Rows, req.Meta)

	if err != nil {

		response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", err.Error()))

		return

	}

	c.Header("X-Export-Row-Count", fmt.Sprintf("%d", rowCount))

	c.Header("X-Export-Layout", "letterhead-v4")

	c.Header("Content-Disposition", "attachment; filename="+reportexport.SafeFileName(req.Title)+".xlsx")

	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes)

}



func (h *ReportExportHandler) exportPDF(c *gin.Context, letterhead reportexport.ReportLetterhead, req ReportExportRequest) {

	if len(req.Columns) == 0 {

		response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", "columns are required for PDF export"))

		return

	}

	rowCount := len(req.Rows)

	if rowCount > reportexport.DefaultMaxRows {

		response.FailWithStatus(c, http.StatusRequestEntityTooLarge, response.Err("REPORT_EXPORT",

			fmt.Sprintf("row count %d exceeds limit %d; narrow filters or use async export", rowCount, reportexport.DefaultMaxRows)))

		return

	}

	bytes, err := reportexport.BuildPDF(letterhead, req.Columns, req.Rows, req.Meta)

	if err != nil {

		response.FailWithStatus(c, http.StatusBadRequest, response.Err("REPORT_EXPORT", err.Error()))

		return

	}

	c.Header("X-Export-Row-Count", fmt.Sprintf("%d", rowCount))

	c.Header("X-Export-Layout", "letterhead-v4")

	c.Header("Content-Disposition", "attachment; filename="+reportexport.SafeFileName(req.Title)+".pdf")

	c.Data(http.StatusOK, "application/pdf", bytes)

}



func (h *ReportExportHandler) resolveLetterhead(c *gin.Context, reportTitle string, meta map[string]string) reportexport.ReportLetterhead {

	letterhead := reportexport.ReportLetterhead{ReportTitle: strings.TrimSpace(reportTitle)}



	companyID := companyIDFromContext(c)

	if companyID == uuid.Nil {

		companyID = companyIDFromMeta(meta)

	}

	if companyID == uuid.Nil || h.CompanyDB == nil {

		return letterhead

	}



	resolved, _ := companylookup.Resolve(h.CompanyDB, companyID)

	letterhead.CompanyName = resolved.CompanyName

	letterhead.CompanyAddress = resolved.CompanyAddress

	return letterhead

}



func companyIDFromContext(c *gin.Context) uuid.UUID {

	raw, ok := c.Get(middleware.CtxCompanyID)

	if !ok {

		return uuid.Nil

	}

	companyID, ok := raw.(uuid.UUID)

	if !ok {

		return uuid.Nil

	}

	return companyID

}



func companyIDFromMeta(meta map[string]string) uuid.UUID {

	if len(meta) == 0 {

		return uuid.Nil

	}

	for _, key := range []string{"CompanyId", "companyId", "company_id", "CompanyID"} {

		if v, ok := meta[key]; ok {

			if id, err := uuid.Parse(strings.TrimSpace(v)); err == nil && id != uuid.Nil {

				return id

			}

		}

	}

	return uuid.Nil

}

