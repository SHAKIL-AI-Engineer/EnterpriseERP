package importsvc

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/enterprise-erp/importexport/internal/domain/enums"
	"github.com/enterprise-erp/importexport/internal/domain/models"
	"github.com/enterprise-erp/importexport/internal/dto"
	"github.com/enterprise-erp/importexport/internal/jobs"
	"github.com/enterprise-erp/importexport/internal/services/csvsvc"
	excelsvc "github.com/enterprise-erp/importexport/internal/services/excel"
	"github.com/enterprise-erp/importexport/internal/services/hrclient"
	"github.com/enterprise-erp/importexport/internal/storage"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

const previewTTL = 2 * time.Hour

var payrollHeaders = []string{
	"EmployeeCode", "PayrollMonth", "GrossSalary", "BasicSalary", "HouseRent",
	"MedicalAllowance", "AttendanceDays", "OvertimeHours", "OvertimeAmount", "Deduction",
}

var shiftHeaders = []string{"EmployeeCode", "ShiftCode", "EffectiveFrom", "EffectiveTo", "Remarks"}
var leaveHeaders = []string{"EmployeeCode", "LeaveType", "FromDate", "ToDate", "Days", "Reason"}

const (
	departmentSelect  = "CAST(Id AS varchar(36)) AS Id, CAST(CompanyId AS varchar(36)) AS CompanyId, NameEn, NameBn, IsActive, CreatedAt, UpdatedAt"
	sectionSelect     = "CAST(Id AS varchar(36)) AS Id, CAST(DepartmentId AS varchar(36)) AS DepartmentId, NameEn, NameBn, IsActive, CreatedAt, UpdatedAt"
	designationSelect = "CAST(Id AS varchar(36)) AS Id, CAST(SectionId AS varchar(36)) AS SectionId, NameEn, NameBn, IsActive, CreatedAt, UpdatedAt"
	lineSelect        = "CAST(Id AS varchar(36)) AS Id, CAST(SectionId AS varchar(36)) AS SectionId, NameEn, NameBn, IsActive, CreatedAt, UpdatedAt"
)

type Service struct {
	DB                            *gorm.DB
	CompanyDB                     *gorm.DB
	Store                         storage.LocalStorage
	ExportDir                     string
	LargeThreshold                int
	EmployeeImportBatchSize       int
	EmployeeImportParallelBatches int
	AsynqClient                   *asynq.Client
	HR                            *hrclient.Client
}

type previewCache struct {
	ModuleName  string         `json:"moduleName"`
	FileName    string         `json:"fileName"`
	FilePath    string         `json:"filePath"`
	ValidJSON   string         `json:"validJson"`
	Errors      []dto.RowError `json:"errors"`
	TotalRows   int            `json:"totalRows"`
	ValidRows   int            `json:"validRows"`
	InvalidRows int            `json:"invalidRows"`
	BearerToken string         `json:"bearerToken,omitempty"`
}

func (s *Service) Preview(companyID, userID uuid.UUID, module, absFilePath, fileName string) (*dto.ImportPreviewResult, error) {
	mod := normalizeModule(module)
	validJSON, total, valid, invalid, errs, err := s.parseModule(mod, absFilePath)
	if err != nil {
		return nil, err
	}
	truncated := false
	if len(errs) > 200 {
		errs = errs[:200]
		truncated = true
	}
	cache := previewCache{
		ModuleName: mod, FileName: fileName, FilePath: absFilePath,
		ValidJSON: validJSON, Errors: errs,
		TotalRows: total, ValidRows: valid, InvalidRows: invalid,
	}
	payload, _ := json.Marshal(cache)
	sess := models.ImportPreviewSession{
		CompanyID: companyID, ModuleName: mod, FileName: fileName, FilePath: absFilePath,
		PayloadJSON: string(payload), ExpiresAt: time.Now().Add(previewTTL), CreatedBy: userID,
	}
	if err := s.DB.Create(&sess).Error; err != nil {
		return nil, err
	}
	return &dto.ImportPreviewResult{
		SessionID: sess.ID, TotalRows: total, ValidRows: valid, InvalidRows: invalid,
		Errors: errs, ErrorsTruncated: truncated,
	}, nil
}

func (s *Service) Confirm(ctx context.Context, companyID, userID uuid.UUID, sessionID uuid.UUID, bearer string) (*dto.ImportJobDTO, error) {
	var sess models.ImportPreviewSession
	if err := s.DB.First(&sess, "id = ? AND company_id = ?", sessionID, companyID).Error; err != nil {
		return nil, fmt.Errorf("session not found")
	}
	if time.Now().After(sess.ExpiresAt) {
		return nil, fmt.Errorf("preview session expired")
	}
	var cache previewCache
	if err := json.Unmarshal([]byte(sess.PayloadJSON), &cache); err != nil {
		return nil, err
	}
	if strings.TrimSpace(bearer) != "" {
		cache.BearerToken = bearer
		payload, err := json.Marshal(cache)
		if err != nil {
			return nil, err
		}
		sess.PayloadJSON = string(payload)
		_ = s.DB.Save(&sess).Error
	}
	if isEmployeeModule(cache.ModuleName) {
		return s.runImport(ctx, companyID, userID, sess, cache)
	}
	if cache.ValidRows > s.LargeThreshold && s.AsynqClient != nil {
		return s.enqueueLargeImport(companyID, userID, sess, cache)
	}
	return s.runImport(ctx, companyID, userID, sess, cache)
}

func (s *Service) enqueueLargeImport(companyID, userID uuid.UUID, sess models.ImportPreviewSession, cache previewCache) (*dto.ImportJobDTO, error) {
	now := time.Now()
	job := models.ImportJob{
		CompanyID: companyID, ModuleName: cache.ModuleName, ImportType: "Excel",
		FileName: sess.FileName, FilePath: sess.FilePath,
		TotalRows: cache.TotalRows, Status: string(enums.ImportPending),
		CreatedBy: userID, PreviewSession: sess.ID.String(), StartedAt: &now,
	}
	if err := s.DB.Create(&job).Error; err != nil {
		return nil, err
	}
	task, err := jobs.NewLargeImportTask(jobs.LargeImportPayload{
		ImportJobID: job.ID.String(), SessionID: sess.ID.String(),
	})
	if err != nil {
		return nil, err
	}
	if _, err := s.AsynqClient.Enqueue(task); err != nil {
		return nil, err
	}
	return toImportDTO(job), nil
}

func (s *Service) ProcessLargeImport(jobID, sessionID uuid.UUID) error {
	var job models.ImportJob
	if err := s.DB.First(&job, "id = ?", jobID).Error; err != nil {
		return err
	}
	var sess models.ImportPreviewSession
	if err := s.DB.First(&sess, "id = ?", sessionID).Error; err != nil {
		return err
	}
	var cache previewCache
	if err := json.Unmarshal([]byte(sess.PayloadJSON), &cache); err != nil {
		return err
	}
	job.Status = string(enums.ImportProcessing)
	_ = s.DB.Save(&job)
	_, err := s.finalizeImport(context.Background(), &job, sess.CompanyID, sess.CreatedBy, cache, cache.BearerToken)
	return err
}

func (s *Service) runImport(ctx context.Context, companyID, userID uuid.UUID, sess models.ImportPreviewSession, cache previewCache) (*dto.ImportJobDTO, error) {
	now := time.Now()
	job := models.ImportJob{
		CompanyID: companyID, ModuleName: cache.ModuleName, ImportType: "Excel",
		FileName: sess.FileName, FilePath: sess.FilePath,
		TotalRows: cache.TotalRows, Status: string(enums.ImportProcessing),
		CreatedBy: userID, PreviewSession: sess.ID.String(), StartedAt: &now,
		ProgressPercentage: 0,
	}
	if err := s.DB.Create(&job).Error; err != nil {
		return nil, err
	}
	dtoJob, err := s.finalizeImport(ctx, &job, companyID, userID, cache, cache.BearerToken)
	if err != nil {
		return nil, err
	}
	_ = s.DB.Delete(&sess)
	return dtoJob, nil
}

func (s *Service) finalizeImport(ctx context.Context, job *models.ImportJob, companyID, userID uuid.UUID, cache previewCache, bearerToken string) (*dto.ImportJobDTO, error) {
	bearer := bearerToken
	if bearer == "" {
		bearer = cache.BearerToken
	}

	allErrors := append([]dto.RowError{}, cache.Errors...)
	successCount := 0
	failedPreview := cache.InvalidRows
	if failedPreview > 0 {
		s.persistEmployeeImportProgress(job.ID, 0, 0, failedPreview, cache.TotalRows)
	}

	if isEmployeeModule(cache.ModuleName) {
		created, updated, applyErrors, err := s.applyEmployeeImport(ctx, job, companyID, cache, bearer)
		if err != nil {
			return nil, err
		}
		successCount = created + updated
		allErrors = mergeRowErrors(allErrors, applyErrors)
		failedPreview = countUniqueErrorRows(allErrors)
	} else {
		successCount = cache.ValidRows
		if cache.ValidJSON != "" && cache.ValidJSON != "[]" {
			staging := []models.ImportStagingRow{{
				ImportJobID: job.ID, RowNumber: 0, ModuleName: cache.ModuleName,
				PayloadJSON: cache.ValidJSON, Status: "Staged",
			}}
			_ = s.DB.Create(&staging).Error
		}
	}

	for _, e := range allErrors {
		_ = s.DB.Create(&models.ImportJobError{
			ImportJobID: job.ID, RowNumber: e.Row, Column: e.Column, Message: e.Message,
		}).Error
	}
	if len(allErrors) > 0 {
		errPath, err := s.writeErrorArtifact(job.ID, allErrors)
		if err == nil {
			job.ErrorFilePath = errPath
		}
	}

	job.SuccessRows = successCount
	job.FailedRows = failedPreview
	job.ProgressPercentage = 100
	now := time.Now()
	job.CompletedAt = &now
	if failedPreview > 0 && successCount > 0 {
		job.Status = string(enums.ImportCompletedWithErrors)
		job.Remarks = "partial success"
	} else if failedPreview > 0 || successCount == 0 && cache.TotalRows > 0 {
		if successCount == 0 && cache.TotalRows > 0 {
			job.Status = string(enums.ImportFailed)
		} else if failedPreview > 0 && successCount == 0 {
			job.Status = string(enums.ImportFailed)
		}
	} else {
		job.Status = string(enums.ImportCompleted)
	}
	if successCount > 0 && failedPreview == 0 {
		job.Status = string(enums.ImportCompleted)
		job.Remarks = ""
	}
	_ = s.DB.Save(job)
	s.writeImportAudit(job, userID)
	return toImportDTO(*job), nil
}

func (s *Service) writeImportAudit(job *models.ImportJob, userID uuid.UUID) {
	if s.DB == nil {
		return
	}
	durationMs := int64(0)
	if job.StartedAt != nil && job.CompletedAt != nil {
		durationMs = job.CompletedAt.Sub(*job.StartedAt).Milliseconds()
	}
	_ = s.DB.Create(&models.ImportAuditLog{
		ImportJobID: job.ID,
		CompanyID:   job.CompanyID,
		ModuleName:  job.ModuleName,
		TotalRows:   job.TotalRows,
		SuccessRows: job.SuccessRows,
		FailedRows:  job.FailedRows,
		Status:      job.Status,
		DurationMs:  durationMs,
		CreatedBy:   userID,
	}).Error
}

func (s *Service) writeErrorArtifact(jobID uuid.UUID, errs []dto.RowError) (string, error) {
	dir := filepath.Join(s.Store.Root, s.ExportDir, "errors")
	_ = os.MkdirAll(dir, 0o750)
	xlsxPath := filepath.Join(dir, jobID.String()+"_errors.xlsx")
	f, err := excelsvc.BuildEmployeeErrorWorkbook(errs)
	if err != nil {
		csvPath := filepath.Join(dir, jobID.String()+"_errors.csv")
		if e := csvsvc.WriteEmployeeErrorCSV(csvPath, errs); e != nil {
			return "", e
		}
		rel, _ := filepath.Rel(s.Store.Root, csvPath)
		return rel, nil
	}
	if err := f.SaveAs(xlsxPath); err != nil {
		return "", err
	}
	rel, _ := filepath.Rel(s.Store.Root, xlsxPath)
	return rel, nil
}

func (s *Service) parseModule(mod, path string) (validJSON string, total, valid, invalid int, errs []dto.RowError, err error) {
	switch mod {
	case string(enums.ModuleEmployee):
		rows, e, err := excelsvc.ParseEmployeeFullImport(path)
		if err != nil {
			return "", 0, 0, 0, nil, err
		}
		b, _ := json.Marshal(rows)
		total = len(rows) + countUniqueErrorRows(e)
		valid = len(rows)
		invalid = countUniqueErrorRows(e)
		return string(b), total, valid, invalid, e, nil
	case string(enums.ModuleAttendance):
		rows, e, err := excelsvc.ParseAttendanceImport(path)
		if err != nil {
			return "", 0, 0, 0, nil, err
		}
		b, _ := json.Marshal(rows)
		total = len(rows) + countUniqueErrorRows(e)
		valid = len(rows)
		invalid = countUniqueErrorRows(e)
		return string(b), total, valid, invalid, e, nil
	case string(enums.ModulePayroll):
		return parseGeneric(path, payrollHeaders)
	case string(enums.ModuleShift):
		return parseGeneric(path, shiftHeaders)
	case string(enums.ModuleLeave):
		return parseGeneric(path, leaveHeaders)
	default:
		return "", 0, 0, 0, nil, fmt.Errorf("unsupported module: %s", mod)
	}
}

func parseGeneric(path string, headers []string) (string, int, int, int, []dto.RowError, error) {
	rows, errs, err := excelsvc.ParseNumericSheet(path, headers)
	if err != nil {
		return "", 0, 0, 0, nil, err
	}
	b, _ := json.Marshal(rows)
	total := len(rows) + countUniqueErrorRows(errs)
	return string(b), total, len(rows), countUniqueErrorRows(errs), errs, nil
}

func countUniqueErrorRows(errs []dto.RowError) int {
	seen := map[int]struct{}{}
	for _, e := range errs {
		if e.Row > 0 {
			seen[e.Row] = struct{}{}
		}
	}
	return len(seen)
}

func (s *Service) ListImportJobs(companyID uuid.UUID, module string, limit int) ([]dto.ImportJobDTO, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	q := s.DB.Where("company_id = ?", companyID).Order("created_at desc").Limit(limit)
	if module != "" {
		q = q.Where("module_name = ?", normalizeModule(module))
	}
	var jobs []models.ImportJob
	if err := q.Find(&jobs).Error; err != nil {
		return nil, err
	}
	out := make([]dto.ImportJobDTO, len(jobs))
	for i, j := range jobs {
		out[i] = *toImportDTO(j)
	}
	return out, nil
}

func (s *Service) GetImportJob(companyID, id uuid.UUID) (*dto.ImportJobDTO, error) {
	var job models.ImportJob
	if err := s.DB.First(&job, "id = ? AND company_id = ?", id, companyID).Error; err != nil {
		return nil, err
	}
	return toImportDTO(job), nil
}

func (s *Service) ErrorFilePath(companyID, id uuid.UUID) (string, error) {
	var job models.ImportJob
	if err := s.DB.First(&job, "id = ? AND company_id = ?", id, companyID).Error; err != nil {
		return "", err
	}
	if job.ErrorFilePath == "" {
		return "", fmt.Errorf("no error file")
	}
	return filepath.Join(s.Store.Root, job.ErrorFilePath), nil
}

func (s *Service) Export(companyID, userID uuid.UUID, module, format string, _ map[string]any, bearer string) (*dto.ExportJobDTO, string, error) {
	mod := normalizeModule(module)
	fm := strings.TrimSpace(format)
	if fm == "" {
		fm = string(enums.FormatExcel)
	}
	if strings.EqualFold(fm, string(enums.FormatPDF)) {
		return nil, "", fmt.Errorf("PDF export is not supported; use Excel or CSV")
	}
	job := models.ExportJob{
		CompanyID: companyID, ModuleName: mod, ExportType: mod,
		Format: fm, Status: string(enums.ExportProcessing), CreatedBy: userID,
	}
	if err := s.DB.Create(&job).Error; err != nil {
		return nil, "", err
	}
	rel, fileName, err := s.buildExportFile(mod, fm, job.ID, companyID, bearer)
	if err != nil {
		job.Status = string(enums.ExportFailed)
		_ = s.DB.Save(&job)
		return nil, "", err
	}
	now := time.Now()
	job.FilePath = rel
	job.FileName = fileName
	job.Status = string(enums.ExportCompleted)
	job.CompletedAt = &now
	_ = s.DB.Save(&job)
	return toExportDTO(job), filepath.Join(s.Store.Root, rel), nil
}

func (s *Service) ImportCompanyOrganogram(path string) (*dto.CompanyOrganogramImportResult, error) {
	if s.CompanyDB == nil {
		return nil, fmt.Errorf("company database is not configured")
	}
	rows, errs, err := excelsvc.ParseCompanyOrganogramImport(path)
	if err != nil {
		return nil, err
	}
	result := &dto.CompanyOrganogramImportResult{
		TotalRows:  len(rows) + countUniqueErrorRows(errs),
		FailedRows: countUniqueErrorRows(errs),
		Errors:     errs,
	}
	if len(rows) == 0 {
		return result, nil
	}

	err = s.CompanyDB.Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			company, companyCreated, err := resolveOrCreateCompany(tx, row)
			if err != nil {
				result.Errors = append(result.Errors, dto.RowError{Row: row.RowIndex, Column: "CompanyNameEn", Message: err.Error()})
				result.FailedRows++
				continue
			}
			if companyCreated {
				result.CompaniesCreated++
			}

			dept, created, err := upsertDepartment(tx, company.ID, row)
			if err != nil {
				result.Errors = append(result.Errors, dto.RowError{Row: row.RowIndex, Column: "DepartmentNameEn", Message: err.Error()})
				result.FailedRows++
				continue
			}
			if created {
				result.DepartmentsCreated++
			} else {
				result.DepartmentsUpdated++
			}

			section, created, err := upsertSection(tx, dept.ID, row)
			if err != nil {
				result.Errors = append(result.Errors, dto.RowError{Row: row.RowIndex, Column: "SectionNameEn", Message: err.Error()})
				result.FailedRows++
				continue
			}
			if created {
				result.SectionsCreated++
			} else {
				result.SectionsUpdated++
			}

			if strings.TrimSpace(row.DesignationNameEn) != "" {
				created, err := upsertDesignation(tx, section.ID, row)
				if err != nil {
					result.Errors = append(result.Errors, dto.RowError{Row: row.RowIndex, Column: "DesignationNameEn", Message: err.Error()})
					result.FailedRows++
					continue
				}
				if created {
					result.DesignationsCreated++
				} else {
					result.DesignationsUpdated++
				}
			}

			if strings.TrimSpace(row.LineNameEn) != "" {
				created, err := upsertLine(tx, section.ID, row)
				if err != nil {
					result.Errors = append(result.Errors, dto.RowError{Row: row.RowIndex, Column: "LineNameEn", Message: err.Error()})
					result.FailedRows++
					continue
				}
				if created {
					result.LinesCreated++
				} else {
					result.LinesUpdated++
				}
			}

			result.SuccessRows++
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if result.FailedRows > result.TotalRows {
		result.FailedRows = result.TotalRows
	}
	return result, nil
}

func (s *Service) ExportCompanyOrganogram(companyName string) (*excelize.File, error) {
	if s.CompanyDB == nil {
		return nil, fmt.Errorf("company database is not configured")
	}
	query := s.CompanyDB.Table("Companies AS c").
		Select(`c.CompanyNameEn, COALESCE(c.CompanyNameBn, '') AS CompanyNameBn,
			d.NameEn AS DepartmentNameEn, d.NameBn AS DepartmentNameBn,
			s.NameEn AS SectionNameEn, s.NameBn AS SectionNameBn,
			COALESCE(ds.NameEn, '') AS DesignationNameEn, COALESCE(ds.NameBn, '') AS DesignationNameBn,
			COALESCE(l.NameEn, '') AS LineNameEn, COALESCE(l.NameBn, '') AS LineNameBn,
			CASE WHEN COALESCE(l.IsActive, ds.IsActive, s.IsActive, d.IsActive, CAST(1 AS bit)) = 1 THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS IsActive`).
		Joins("JOIN Departments AS d ON d.CompanyId = c.Id").
		Joins("JOIN Sections AS s ON s.DepartmentId = d.Id").
		Joins("LEFT JOIN Designations AS ds ON ds.SectionId = s.Id").
		Joins("LEFT JOIN Lines AS l ON l.SectionId = s.Id").
		Order("c.CompanyNameEn, d.NameEn, s.NameEn, ds.NameEn, l.NameEn")
	if strings.TrimSpace(companyName) != "" {
		query = query.Where("c.CompanyNameEn = ?", strings.TrimSpace(companyName))
	}
	var rows []excelsvc.CompanyOrganogramRow
	if err := query.Scan(&rows).Error; err != nil {
		return nil, err
	}
	return excelsvc.BuildCompanyOrganogramWorkbook(rows)
}

func upsertDepartment(tx *gorm.DB, companyID string, row excelsvc.CompanyOrganogramRow) (*models.CompanyDepartment, bool, error) {
	var dept models.CompanyDepartment
	nameEn := organogramName(row.DepartmentNameEn)
	err := tx.Select(departmentSelect).Where("CompanyId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", companyID, nameEn).Order("CreatedAt, Id").Take(&dept).Error
	now := time.Now()
	if err == nil {
		dept.NameEn = nameEn
		dept.NameBn = fallback(row.DepartmentNameBn, nameEn)
		dept.IsActive = row.IsActive
		dept.UpdatedAt = &now
		if err := tx.Save(&dept).Error; err != nil {
			return nil, false, err
		}
		return &dept, false, deduplicateDepartments(tx, dept.ID, companyID, nameEn)
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}
	dept = models.CompanyDepartment{
		ID: uuid.NewString(), CompanyID: companyID, NameEn: nameEn,
		NameBn:   fallback(row.DepartmentNameBn, nameEn),
		IsActive: row.IsActive, CreatedAt: now,
	}
	return &dept, true, tx.Create(&dept).Error
}

func upsertSection(tx *gorm.DB, departmentID string, row excelsvc.CompanyOrganogramRow) (*models.CompanySection, bool, error) {
	var section models.CompanySection
	nameEn := organogramName(row.SectionNameEn)
	err := tx.Select(sectionSelect).Where("DepartmentId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", departmentID, nameEn).Order("CreatedAt, Id").Take(&section).Error
	now := time.Now()
	if err == nil {
		section.NameEn = nameEn
		section.NameBn = fallback(row.SectionNameBn, nameEn)
		section.IsActive = row.IsActive
		section.UpdatedAt = &now
		if err := tx.Save(&section).Error; err != nil {
			return nil, false, err
		}
		return &section, false, deduplicateSections(tx, section.ID, departmentID, nameEn)
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}
	section = models.CompanySection{
		ID: uuid.NewString(), DepartmentID: departmentID, NameEn: nameEn,
		NameBn:   fallback(row.SectionNameBn, nameEn),
		IsActive: row.IsActive, CreatedAt: now,
	}
	return &section, true, tx.Create(&section).Error
}

func upsertDesignation(tx *gorm.DB, sectionID string, row excelsvc.CompanyOrganogramRow) (bool, error) {
	var designation models.CompanyDesignation
	nameEn := organogramName(row.DesignationNameEn)
	err := tx.Select(designationSelect).Where("SectionId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", sectionID, nameEn).Order("CreatedAt, Id").Take(&designation).Error
	now := time.Now()
	if err == nil {
		designation.NameEn = nameEn
		designation.NameBn = fallback(row.DesignationNameBn, nameEn)
		designation.IsActive = row.IsActive
		designation.UpdatedAt = &now
		if err := tx.Save(&designation).Error; err != nil {
			return false, err
		}
		return false, deduplicateDesignations(tx, designation.ID, sectionID, nameEn)
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}
	designation = models.CompanyDesignation{
		ID: uuid.NewString(), SectionID: sectionID, NameEn: nameEn,
		NameBn:   fallback(row.DesignationNameBn, nameEn),
		IsActive: row.IsActive, CreatedAt: now,
	}
	return true, tx.Create(&designation).Error
}

func upsertLine(tx *gorm.DB, sectionID string, row excelsvc.CompanyOrganogramRow) (bool, error) {
	var line models.CompanyLine
	nameEn := organogramName(row.LineNameEn)
	err := tx.Select(lineSelect).Where("SectionId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", sectionID, nameEn).Order("CreatedAt, Id").Take(&line).Error
	now := time.Now()
	if err == nil {
		line.NameEn = nameEn
		line.NameBn = fallback(row.LineNameBn, nameEn)
		line.IsActive = row.IsActive
		line.UpdatedAt = &now
		if err := tx.Save(&line).Error; err != nil {
			return false, err
		}
		return false, deduplicateLines(tx, line.ID, sectionID, nameEn)
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}
	line = models.CompanyLine{
		ID: uuid.NewString(), SectionID: sectionID, NameEn: nameEn,
		NameBn:   fallback(row.LineNameBn, nameEn),
		IsActive: row.IsActive, CreatedAt: now,
	}
	return true, tx.Create(&line).Error
}

func fallback(value, fallback string) string {
	value = organogramName(value)
	if value == "" {
		return organogramName(fallback)
	}
	return value
}

func deduplicateDepartments(tx *gorm.DB, keepID, companyID string, name string) error {
	var duplicates []models.CompanyDepartment
	if err := tx.Select(departmentSelect).Where("Id <> ? AND CompanyId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", keepID, companyID, organogramName(name)).Order("CreatedAt, Id").Find(&duplicates).Error; err != nil {
		return err
	}
	for _, duplicate := range duplicates {
		var sections []models.CompanySection
		if err := tx.Select(sectionSelect).Where("DepartmentId = ?", duplicate.ID).Find(&sections).Error; err != nil {
			return err
		}
		for _, section := range sections {
			if err := mergeSectionIntoDepartment(tx, section, keepID); err != nil {
				return err
			}
		}
		if err := tx.Delete(&duplicate).Error; err != nil {
			return err
		}
	}
	return nil
}

func mergeSectionIntoDepartment(tx *gorm.DB, section models.CompanySection, targetDepartmentID string) error {
	name := organogramName(section.NameEn)
	var existing models.CompanySection
	err := tx.Select(sectionSelect).Where("DepartmentId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", targetDepartmentID, name).Order("CreatedAt, Id").Take(&existing).Error
	if err == nil {
		if err := mergeSectionChildren(tx, section.ID, existing.ID); err != nil {
			return err
		}
		return tx.Delete(&section).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	return tx.Model(&section).Update("DepartmentId", targetDepartmentID).Error
}

func deduplicateSections(tx *gorm.DB, keepID, departmentID string, name string) error {
	var duplicates []models.CompanySection
	if err := tx.Select(sectionSelect).Where("Id <> ? AND DepartmentId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", keepID, departmentID, organogramName(name)).Order("CreatedAt, Id").Find(&duplicates).Error; err != nil {
		return err
	}
	for _, duplicate := range duplicates {
		if err := mergeSectionChildren(tx, duplicate.ID, keepID); err != nil {
			return err
		}
		if err := tx.Delete(&duplicate).Error; err != nil {
			return err
		}
	}
	return nil
}

func mergeSectionChildren(tx *gorm.DB, fromSectionID, toSectionID string) error {
	var designations []models.CompanyDesignation
	if err := tx.Select(designationSelect).Where("SectionId = ?", fromSectionID).Find(&designations).Error; err != nil {
		return err
	}
	for _, designation := range designations {
		if err := mergeDesignationIntoSection(tx, designation, toSectionID); err != nil {
			return err
		}
	}
	var lines []models.CompanyLine
	if err := tx.Select(lineSelect).Where("SectionId = ?", fromSectionID).Find(&lines).Error; err != nil {
		return err
	}
	for _, line := range lines {
		if err := mergeLineIntoSection(tx, line, toSectionID); err != nil {
			return err
		}
	}
	return nil
}

func mergeDesignationIntoSection(tx *gorm.DB, designation models.CompanyDesignation, targetSectionID string) error {
	name := organogramName(designation.NameEn)
	var existing models.CompanyDesignation
	err := tx.Select(designationSelect).Where("SectionId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", targetSectionID, name).Order("CreatedAt, Id").Take(&existing).Error
	if err == nil {
		return tx.Delete(&designation).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	return tx.Model(&designation).Update("SectionId", targetSectionID).Error
}

func mergeLineIntoSection(tx *gorm.DB, line models.CompanyLine, targetSectionID string) error {
	name := organogramName(line.NameEn)
	var existing models.CompanyLine
	err := tx.Select(lineSelect).Where("SectionId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", targetSectionID, name).Order("CreatedAt, Id").Take(&existing).Error
	if err == nil {
		return tx.Delete(&line).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	return tx.Model(&line).Update("SectionId", targetSectionID).Error
}

func deduplicateDesignations(tx *gorm.DB, keepID, sectionID string, name string) error {
	return tx.Where("Id <> ? AND SectionId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", keepID, sectionID, organogramName(name)).Delete(&models.CompanyDesignation{}).Error
}

func deduplicateLines(tx *gorm.DB, keepID, sectionID string, name string) error {
	return tx.Where("Id <> ? AND SectionId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", keepID, sectionID, organogramName(name)).Delete(&models.CompanyLine{}).Error
}

func (s *Service) buildExportFile(module, format string, jobID uuid.UUID, companyID uuid.UUID, bearer string) (rel, name string, err error) {
	dir := filepath.Join(s.Store.Root, s.ExportDir)
	_ = os.MkdirAll(dir, 0o750)
	switch normalizeModule(module) {
	case string(enums.ModuleEmployee):
		var exportRows []excelsvc.EmployeeFullImportRow
		if s.HR != nil && strings.TrimSpace(bearer) != "" {
			if rows, e := s.HR.GetEmployeesExport(context.Background(), bearer, companyID.String()); e == nil {
				exportRows = mapHRRowsToExcel(rows)
			}
		}
		if len(exportRows) == 0 {
			exportRows = excelsvc.SampleEmployeeFullRows()
		}
		f, err := excelsvc.ExportEmployeesFullExcel(exportRows)
		if err != nil {
			return "", "", err
		}
		name = fmt.Sprintf("%s_employees.xlsx", jobID)
		full := filepath.Join(dir, name)
		if err := f.SaveAs(full); err != nil {
			return "", "", err
		}
		rel, _ = filepath.Rel(s.Store.Root, full)
		return rel, name, nil
	case string(enums.ModulePayroll), string(enums.ModuleSalarySheet):
		f, err := excelsvc.ExportPayrollExcel(samplePayroll())
		if err != nil {
			return "", "", err
		}
		name = fmt.Sprintf("%s_payroll.xlsx", jobID)
		full := filepath.Join(dir, name)
		if err := f.SaveAs(full); err != nil {
			return "", "", err
		}
		rel, _ = filepath.Rel(s.Store.Root, full)
		return rel, name, nil
	default:
		if strings.EqualFold(format, string(enums.FormatCSV)) {
			name = fmt.Sprintf("%s_%s.csv", jobID, module)
			full := filepath.Join(dir, name)
			if err := csvsvc.WriteRows(full, []string{"Message"}, [][]string{{"export placeholder — integrate HR data source"}}); err != nil {
				return "", "", err
			}
			rel, _ = filepath.Rel(s.Store.Root, full)
			return rel, name, nil
		}
		f := excelize.NewFile()
		_ = f.SetCellValue("Sheet1", "A1", "No data — configure integration for "+module)
		name = fmt.Sprintf("%s_%s.xlsx", jobID, module)
		full := filepath.Join(dir, name)
		if err := f.SaveAs(full); err != nil {
			return "", "", err
		}
		rel, _ = filepath.Rel(s.Store.Root, full)
		return rel, name, nil
	}
}

func (s *Service) ListExportJobs(companyID uuid.UUID, limit int) ([]dto.ExportJobDTO, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var jobs []models.ExportJob
	if err := s.DB.Where("company_id = ?", companyID).Order("created_at desc").Limit(limit).Find(&jobs).Error; err != nil {
		return nil, err
	}
	out := make([]dto.ExportJobDTO, len(jobs))
	for i, j := range jobs {
		out[i] = *toExportDTO(j)
	}
	return out, nil
}

func (s *Service) GetExportJob(companyID, id uuid.UUID) (*models.ExportJob, error) {
	var job models.ExportJob
	if err := s.DB.First(&job, "id = ? AND company_id = ?", id, companyID).Error; err != nil {
		return nil, err
	}
	return &job, nil
}

func normalizeModule(m string) string {
	switch strings.ToLower(strings.TrimSpace(m)) {
	case "employee", "employees":
		return string(enums.ModuleEmployee)
	case "attendance":
		return string(enums.ModuleAttendance)
	case "payroll":
		return string(enums.ModulePayroll)
	case "shift":
		return string(enums.ModuleShift)
	case "leave":
		return string(enums.ModuleLeave)
	case "salarysheet", "salary-sheet":
		return string(enums.ModuleSalarySheet)
	default:
		m = strings.TrimSpace(m)
		if m == "" {
			return m
		}
		return strings.ToUpper(m[:1]) + strings.ToLower(m[1:])
	}
}

func toImportDTO(j models.ImportJob) *dto.ImportJobDTO {
	return &dto.ImportJobDTO{
		ID: j.ID, CompanyID: j.CompanyID, ModuleName: j.ModuleName, Status: j.Status,
		TotalRows: j.TotalRows, SuccessRows: j.SuccessRows, FailedRows: j.FailedRows,
		CreatedRows: j.CreatedRows, UpdatedRows: j.UpdatedRows,
		ErrorFilePath: j.ErrorFilePath, ProgressPercentage: j.ProgressPercentage,
		Remarks: j.Remarks, CreatedAt: j.CreatedAt.Format(time.RFC3339),
	}
}

func toExportDTO(j models.ExportJob) *dto.ExportJobDTO {
	return &dto.ExportJobDTO{
		ID: j.ID, ModuleName: j.ModuleName, Format: j.Format, Status: j.Status,
		FilePath: j.FilePath, CreatedAt: j.CreatedAt.Format(time.RFC3339),
	}
}

func sampleEmployees() []excelsvc.EmployeeExportRow {
	return []excelsvc.EmployeeExportRow{
		{PunchNumber: 1, EmployeeID: "EMP-0001", EmployeeName: "Sample User", Department: "HR", Designation: "Executive", JoinDate: time.Now(), Status: "Active", GrossSalary: 55000},
	}
}

func samplePayroll() []excelsvc.PayrollExportRow {
	return []excelsvc.PayrollExportRow{
		{EmployeeID: "EMP-0001", EmployeeName: "Sample User", Department: "HR", Designation: "Executive",
			GrossSalary: 55000, BasicSalary: 27500, HouseRent: 13750, MedicalAllowance: 2750,
			AttendanceDays: 26, OvertimeHours: 4, OvertimeAmount: 1200, Deduction: 500},
	}
}
