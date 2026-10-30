package importsvc

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/enterprise-erp/importexport/internal/domain/models"
	excelsvc "github.com/enterprise-erp/importexport/internal/services/excel"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type companyScan struct {
	ID            string  `gorm:"column:Id"`
	CompanyNameEn string  `gorm:"column:CompanyNameEn"`
	CompanyNameBn *string `gorm:"column:CompanyNameBn"`
	Status        string  `gorm:"column:Status"`
}

func findCompany(tx *gorm.DB, row excelsvc.CompanyOrganogramRow) (*models.CompanyMaster, error) {
	var r companyScan
	q := tx.Table("Companies").Select("CAST(Id AS varchar(36)) AS Id, CompanyNameEn, CompanyNameBn, Status")
	name := organogramName(row.CompanyNameEn)
	if name == "" {
		return nil, gorm.ErrRecordNotFound
	}
	if err := q.Where("UPPER(LTRIM(RTRIM(CompanyNameEn))) = UPPER(?)", name).Order("CreatedAt, Id").Take(&r).Error; err != nil {
		return nil, err
	}
	return &models.CompanyMaster{
		ID:            strings.ToLower(r.ID),
		CompanyNameEn: r.CompanyNameEn,
		CompanyNameBn: r.CompanyNameBn,
		Status:        r.Status,
	}, nil
}

func createCompanyFromRow(tx *gorm.DB, row excelsvc.CompanyOrganogramRow) (*models.CompanyMaster, error) {
	nameEn := organogramName(row.CompanyNameEn)
	var existing int64
	if err := tx.Table("Companies").Where("UPPER(LTRIM(RTRIM(CompanyNameEn))) = UPPER(?)", nameEn).Count(&existing).Error; err != nil {
		return nil, err
	}
	if existing > 0 {
		return nil, fmt.Errorf("company name %q already exists", nameEn)
	}

	nameBn := organogramName(row.CompanyNameBn)
	if nameBn == "" {
		nameBn = nameEn
	}
	var bnPtr *string
	if nameBn != "" {
		bnPtr = &nameBn
	}

	now := time.Now()
	company := models.CompanyMaster{
		ID:            uuid.NewString(),
		CompanyNameEn: nameEn,
		CompanyNameBn: bnPtr,
		Status:        "Active",
		CreatedAt:     now,
	}
	if err := tx.Create(&company).Error; err != nil {
		return nil, err
	}
	return &company, nil
}

func resolveOrCreateCompany(tx *gorm.DB, row excelsvc.CompanyOrganogramRow) (*models.CompanyMaster, bool, error) {
	company, err := findCompany(tx, row)
	if err == nil {
		now := time.Now()
		company.CompanyNameEn = organogramName(row.CompanyNameEn)
		nameBn := organogramName(row.CompanyNameBn)
		if nameBn == "" {
			nameBn = company.CompanyNameEn
		}
		company.CompanyNameBn = &nameBn
		company.UpdatedAt = &now
		if err := tx.Save(company).Error; err != nil {
			return nil, false, err
		}
		return company, false, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}
	if organogramName(row.CompanyNameEn) == "" {
		return nil, false, fmt.Errorf("CompanyNameEn is required")
	}
	company, err = createCompanyFromRow(tx, row)
	return company, err == nil, err
}

func organogramName(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}

func (s *Service) BuildCompanyOrganogramDemoWorkbook() (*excelize.File, error) {
	if s.CompanyDB != nil {
		var deptCount int64
		if err := s.CompanyDB.Table("Departments").Count(&deptCount).Error; err == nil && deptCount > 0 {
			return s.ExportCompanyOrganogram("")
		}
	}
	return excelsvc.BuildCompanyOrganogramDemoWorkbook()
}
