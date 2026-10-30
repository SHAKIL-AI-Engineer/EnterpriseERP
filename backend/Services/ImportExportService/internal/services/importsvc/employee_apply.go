package importsvc

import (
	"context"
	"encoding/json"
	"fmt"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/enterprise-erp/importexport/internal/domain/enums"
	"github.com/enterprise-erp/importexport/internal/domain/models"
	"github.com/enterprise-erp/importexport/internal/dto"
	excelsvc "github.com/enterprise-erp/importexport/internal/services/excel"
	"github.com/enterprise-erp/importexport/internal/services/hrclient"
	"github.com/google/uuid"
)

const (
	defaultEmployeeUpsertBatchSize     = 150
	defaultEmployeeImportParallelBatch = 8
)

type employeeBatchResult struct {
	created int
	updated int
	errors  []dto.RowError
}

func (s *Service) employeeUpsertBatchSize() int {
	if s.EmployeeImportBatchSize > 0 {
		return s.EmployeeImportBatchSize
	}
	return defaultEmployeeUpsertBatchSize
}

func (s *Service) employeeImportParallelBatches() int {
	if s.EmployeeImportParallelBatches > 0 {
		return s.EmployeeImportParallelBatches
	}
	return defaultEmployeeImportParallelBatch
}

func (s *Service) applyEmployeeImport(ctx context.Context, job *models.ImportJob, companyID uuid.UUID, cache previewCache, bearer string) (created, updated int, applyErrors []dto.RowError, err error) {
	if strings.TrimSpace(bearer) == "" {
		return 0, 0, nil, fmt.Errorf("authorization token required for employee import")
	}
	if s.HR == nil {
		return 0, 0, nil, fmt.Errorf("HR client is not configured")
	}
	if cache.ValidJSON == "" || cache.ValidJSON == "[]" {
		return 0, 0, nil, nil
	}

	var rows []excelsvc.EmployeeFullImportRow
	if err := json.Unmarshal([]byte(cache.ValidJSON), &rows); err != nil {
		return 0, 0, nil, fmt.Errorf("parse staged rows: %w", err)
	}

	importCtx, cancel := context.WithTimeout(ctx, 30*time.Minute)
	defer cancel()

	rows, duplicateErrors, err := s.filterDatabaseDuplicates(importCtx, bearer, companyID, rows)
	if err != nil {
		return 0, 0, nil, err
	}
	applyErrors = append(applyErrors, duplicateErrors...)
	if len(rows) == 0 {
		return 0, 0, applyErrors, nil
	}

	companyIDStr := companyID.String()
	batchSize := s.employeeUpsertBatchSize()
	parallel := s.employeeImportParallelBatches()
	if parallel < 1 {
		parallel = 1
	}
	if parallel > runtime.NumCPU() {
		parallel = runtime.NumCPU()
	}
	if parallel < 1 {
		parallel = 1
	}

	type batchJob struct {
		index int
		start int
		end   int
	}
	var jobs []batchJob
	for i := 0; i < len(rows); i += batchSize {
		end := i + batchSize
		if end > len(rows) {
			end = len(rows)
		}
		jobs = append(jobs, batchJob{index: len(jobs), start: i, end: end})
	}

	results := make([]employeeBatchResult, len(jobs))
	jobCh := make(chan batchJob)
	var wg sync.WaitGroup
	var firstErr error
	var errMu sync.Mutex
	var createdTotal int64
	var updatedTotal int64
	var failedTotal int64 = int64(len(duplicateErrors) + cache.InvalidRows)

	for i := 0; i < parallel; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobCh {
				if importCtx.Err() != nil {
					errMu.Lock()
					if firstErr == nil {
						firstErr = importCtx.Err()
					}
					errMu.Unlock()
					continue
				}

				batchRows := rows[j.start:j.end]
				batch := mapExcelRowsToHR(batchRows)
				result, callErr := s.HR.ImportUpsert(importCtx, bearer, companyIDStr, batch)
				var br employeeBatchResult
				if callErr != nil {
					for _, row := range batchRows {
						br.errors = append(br.errors, dto.RowError{
							Row: row.RowIndex, Column: "Import", Message: callErr.Error(),
						})
					}
				} else {
					br.created = result.Created
					br.updated = result.Updated
					for _, e := range result.Errors {
						br.errors = append(br.errors, dto.RowError{
							Row: e.RowIndex, Column: e.Field, Message: e.Message,
						})
					}
				}

				results[j.index] = br
				c := atomic.AddInt64(&createdTotal, int64(br.created))
				u := atomic.AddInt64(&updatedTotal, int64(br.updated))
				f := atomic.AddInt64(&failedTotal, int64(countUniqueErrorRows(br.errors)))
				s.persistEmployeeImportProgress(job.ID, int(c), int(u), int(f), cache.TotalRows)
			}
		}()
	}

	for _, j := range jobs {
		select {
		case <-importCtx.Done():
			errMu.Lock()
			if firstErr == nil {
				firstErr = importCtx.Err()
			}
			errMu.Unlock()
		case jobCh <- j:
		}
	}
	close(jobCh)
	wg.Wait()
	if firstErr != nil {
		return 0, 0, nil, firstErr
	}

	for _, r := range results {
		created += r.created
		updated += r.updated
		applyErrors = append(applyErrors, r.errors...)
	}

	job.CreatedRows = created
	job.UpdatedRows = updated
	return created, updated, applyErrors, nil
}

func (s *Service) filterDatabaseDuplicates(ctx context.Context, bearer string, companyID uuid.UUID, rows []excelsvc.EmployeeFullImportRow) ([]excelsvc.EmployeeFullImportRow, []dto.RowError, error) {
	existingRows, err := s.HR.GetEmployeesExport(ctx, bearer, companyID.String())
	if err != nil {
		return nil, nil, fmt.Errorf("database duplicate check failed: %w", err)
	}
	existingEmployeeIDs := make(map[string]struct{}, len(existingRows))
	existingPunchNumbers := make(map[int]struct{}, len(existingRows))
	for _, row := range existingRows {
		employeeID := strings.ToUpper(strings.TrimSpace(row.EmployeeID))
		if employeeID != "" {
			existingEmployeeIDs[employeeID] = struct{}{}
		}
		if row.PunchNumber > 0 {
			existingPunchNumbers[row.PunchNumber] = struct{}{}
		}
	}

	valid := make([]excelsvc.EmployeeFullImportRow, 0, len(rows))
	var errs []dto.RowError
	for _, row := range rows {
		hasError := false
		if _, exists := existingEmployeeIDs[strings.ToUpper(strings.TrimSpace(row.EmployeeID))]; exists {
			errs = append(errs, dto.RowError{Row: row.RowIndex, Column: "EmployeeID", Message: "already exists in database"})
			hasError = true
		}
		if _, exists := existingPunchNumbers[row.PunchNumber]; exists {
			errs = append(errs, dto.RowError{Row: row.RowIndex, Column: "PunchNumber", Message: "already exists in database"})
			hasError = true
		}
		if !hasError {
			valid = append(valid, row)
		}
	}
	return valid, errs, nil
}

func (s *Service) persistEmployeeImportProgress(jobID uuid.UUID, created, updated, failed, total int) {
	if s.DB == nil {
		return
	}
	success := created + updated
	processed := success + failed
	progress := 0
	if total > 0 {
		progress = processed * 100 / total
		if progress > 99 && processed < total {
			progress = 99
		}
		if progress > 100 {
			progress = 100
		}
	}
	_ = s.DB.Model(&models.ImportJob{}).Where("id = ?", jobID).Updates(map[string]interface{}{
		"created_rows":        created,
		"updated_rows":        updated,
		"success_rows":        success,
		"failed_rows":         failed,
		"progress_percentage": progress,
	}).Error
}

func mapExcelRowsToHR(rows []excelsvc.EmployeeFullImportRow) []hrclient.EmployeeFullImportRow {
	out := make([]hrclient.EmployeeFullImportRow, len(rows))
	for i, r := range rows {
		joinDate := r.JoinDate.Format("2006-01-02T00:00:00Z")
		out[i] = hrclient.EmployeeFullImportRow{
			RowIndex:                 r.RowIndex,
			PunchNumber:              r.PunchNumber,
			EmployeeID:               r.EmployeeID,
			FullName:                 r.FullName,
			BanglaName:               r.BanglaName,
			Gender:                   r.Gender,
			Religion:                 r.Religion,
			BloodGroup:               r.BloodGroup,
			DateOfBirth:              r.DateOfBirth,
			NationalId:               r.NationalId,
			BirthCertificateNo:       r.BirthCertificateNo,
			Phone:                    r.Phone,
			Email:                    r.Email,
			JoinDate:                 joinDate,
			EmploymentType:           r.EmploymentType,
			Status:                   r.Status,
			IsOtEnabled:              r.IsOtEnabled,
			DepartmentName:           r.DepartmentName,
			SectionName:              r.SectionName,
			DesignationName:          r.DesignationName,
			GradeName:                r.GradeName,
			GroupName:                r.GroupName,
			LineName:                 r.LineName,
			SupervisorEmployeeID:     r.SupervisorEmployeeID,
			BasicSalary:              r.BasicSalary,
			HouseRent:                r.HouseRent,
			MedicalAllowance:         r.MedicalAllowance,
			ConveyanceAllowance:      r.ConveyanceAllowance,
			FoodAllowance:            r.FoodAllowance,
			FatherNameEn:             r.FatherNameEn,
			FatherNameBn:             r.FatherNameBn,
			MotherNameEn:             r.MotherNameEn,
			MotherNameBn:             r.MotherNameBn,
			MaritalStatus:            r.MaritalStatus,
			SpouseNameEn:             r.SpouseNameEn,
			SpouseNameBn:             r.SpouseNameBn,
			SpouseOccupation:         r.SpouseOccupation,
			SpouseContact:            r.SpouseContact,
			EducationLevel:           r.EducationLevel,
			Institution:              r.Institution,
			FieldOfStudy:             r.FieldOfStudy,
			Skills:                   r.Skills,
			Reference1Name:           r.Reference1Name,
			Reference1Relation:       r.Reference1Relation,
			Reference1Phone:          r.Reference1Phone,
			Reference1Address:        r.Reference1Address,
			Reference2Name:           r.Reference2Name,
			Reference2Relation:       r.Reference2Relation,
			Reference2Phone:          r.Reference2Phone,
			Reference2Address:        r.Reference2Address,
			PresentDivision:          r.PresentDivision,
			PresentDistrict:          r.PresentDistrict,
			PresentUpazila:           r.PresentUpazila,
			PresentPostOffice:        r.PresentPostOffice,
			PresentPostalCode:        r.PresentPostalCode,
			PresentAddress:           r.PresentAddress,
			PermanentDivision:        r.PermanentDivision,
			PermanentDistrict:        r.PermanentDistrict,
			PermanentUpazila:         r.PermanentUpazila,
			PermanentPostOffice:      r.PermanentPostOffice,
			PermanentPostalCode:      r.PermanentPostalCode,
			PermanentAddress:         r.PermanentAddress,
			BankName:                 r.BankName,
			BranchName:               r.BranchName,
			AccountNo:                r.AccountNo,
			RoutingNo:                r.RoutingNo,
			BankAccountType:          r.BankAccountType,
			MobileBankingNo:          r.MobileBankingNo,
			EmergencyContactName:     r.EmergencyContactName,
			EmergencyContactRelation: r.EmergencyContactRelation,
			EmergencyContactPhone:    r.EmergencyContactPhone,
			EmergencyContactAddress:  r.EmergencyContactAddress,
			ProfileImageUrl:          r.ProfileImageUrl,
			SignatureImageUrl:        r.SignatureImageUrl,
		}
	}
	return out
}

func mergeRowErrors(a, b []dto.RowError) []dto.RowError {
	out := make([]dto.RowError, 0, len(a)+len(b))
	out = append(out, a...)
	out = append(out, b...)
	return out
}

func isEmployeeModule(module string) bool {
	return normalizeModule(module) == string(enums.ModuleEmployee)
}

func mapHRRowsToExcel(rows []hrclient.EmployeeFullImportRow) []excelsvc.EmployeeFullImportRow {
	out := make([]excelsvc.EmployeeFullImportRow, len(rows))
	for i, r := range rows {
		joinDate, _ := time.Parse(time.RFC3339, r.JoinDate)
		if joinDate.IsZero() {
			joinDate, _ = time.Parse("2006-01-02", r.JoinDate)
		}
		if joinDate.IsZero() {
			joinDate = time.Now().UTC()
		}
		out[i] = excelsvc.EmployeeFullImportRow{
			RowIndex:                 r.RowIndex,
			PunchNumber:              r.PunchNumber,
			EmployeeID:               r.EmployeeID,
			FullName:                 r.FullName,
			BanglaName:               r.BanglaName,
			Gender:                   r.Gender,
			Religion:                 r.Religion,
			BloodGroup:               r.BloodGroup,
			DateOfBirth:              r.DateOfBirth,
			NationalId:               r.NationalId,
			BirthCertificateNo:       r.BirthCertificateNo,
			Phone:                    r.Phone,
			Email:                    r.Email,
			JoinDate:                 joinDate,
			EmploymentType:           r.EmploymentType,
			Status:                   r.Status,
			IsOtEnabled:              r.IsOtEnabled,
			DepartmentName:           r.DepartmentName,
			SectionName:              r.SectionName,
			DesignationName:          r.DesignationName,
			GradeName:                r.GradeName,
			GroupName:                r.GroupName,
			LineName:                 r.LineName,
			SupervisorEmployeeID:     r.SupervisorEmployeeID,
			BasicSalary:              r.BasicSalary,
			HouseRent:                r.HouseRent,
			MedicalAllowance:         r.MedicalAllowance,
			ConveyanceAllowance:      r.ConveyanceAllowance,
			FoodAllowance:            r.FoodAllowance,
			FatherNameEn:             r.FatherNameEn,
			FatherNameBn:             r.FatherNameBn,
			MotherNameEn:             r.MotherNameEn,
			MotherNameBn:             r.MotherNameBn,
			MaritalStatus:            r.MaritalStatus,
			SpouseNameEn:             r.SpouseNameEn,
			SpouseNameBn:             r.SpouseNameBn,
			SpouseOccupation:         r.SpouseOccupation,
			SpouseContact:            r.SpouseContact,
			EducationLevel:           r.EducationLevel,
			Institution:              r.Institution,
			FieldOfStudy:             r.FieldOfStudy,
			Skills:                   r.Skills,
			Reference1Name:           r.Reference1Name,
			Reference1Relation:       r.Reference1Relation,
			Reference1Phone:          r.Reference1Phone,
			Reference1Address:        r.Reference1Address,
			Reference2Name:           r.Reference2Name,
			Reference2Relation:       r.Reference2Relation,
			Reference2Phone:          r.Reference2Phone,
			Reference2Address:        r.Reference2Address,
			PresentDivision:          r.PresentDivision,
			PresentDistrict:          r.PresentDistrict,
			PresentUpazila:           r.PresentUpazila,
			PresentPostOffice:        r.PresentPostOffice,
			PresentPostalCode:        r.PresentPostalCode,
			PresentAddress:           r.PresentAddress,
			PermanentDivision:        r.PermanentDivision,
			PermanentDistrict:        r.PermanentDistrict,
			PermanentUpazila:         r.PermanentUpazila,
			PermanentPostOffice:      r.PermanentPostOffice,
			PermanentPostalCode:      r.PermanentPostalCode,
			PermanentAddress:         r.PermanentAddress,
			BankName:                 r.BankName,
			BranchName:               r.BranchName,
			AccountNo:                r.AccountNo,
			RoutingNo:                r.RoutingNo,
			BankAccountType:          r.BankAccountType,
			MobileBankingNo:          r.MobileBankingNo,
			EmergencyContactName:     r.EmergencyContactName,
			EmergencyContactRelation: r.EmergencyContactRelation,
			EmergencyContactPhone:    r.EmergencyContactPhone,
			EmergencyContactAddress:  r.EmergencyContactAddress,
			ProfileImageUrl:          r.ProfileImageUrl,
			SignatureImageUrl:        r.SignatureImageUrl,
		}
	}
	return out
}
