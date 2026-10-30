package importsvc

import (
	"errors"
	"fmt"
	"strings"

	"github.com/enterprise-erp/importexport/internal/domain/models"
	"github.com/enterprise-erp/importexport/internal/dto"
	excelsvc "github.com/enterprise-erp/importexport/internal/services/excel"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

const (
	countrySelect    = "CAST(Id AS varchar(36)) AS Id, NameEn, NameBn, Code, IsActive"
	divisionSelect   = "CAST(Id AS varchar(36)) AS Id, CAST(CountryId AS varchar(36)) AS CountryId, NameEn, NameBn, IsActive"
	districtSelect   = "CAST(Id AS varchar(36)) AS Id, CAST(DivisionId AS varchar(36)) AS DivisionId, NameEn, NameBn, IsActive"
	upazilaSelect    = "CAST(Id AS varchar(36)) AS Id, CAST(DistrictId AS varchar(36)) AS DistrictId, NameEn, NameBn, IsActive"
	postOfficeSelect = "CAST(Id AS varchar(36)) AS Id, CAST(UpazilaId AS varchar(36)) AS UpazilaId, NameEn, NameBn, PostalCode, IsActive"
)

type addressRowCounts struct {
	countriesCreated   int
	countriesUpdated   int
	divisionsCreated   int
	divisionsUpdated   int
	districtsCreated   int
	districtsUpdated   int
	thanasCreated      int
	thanasUpdated      int
	postOfficesCreated int
	postOfficesUpdated int
}

func (s *Service) ImportAddress(path string) (*dto.AddressImportResult, error) {
	if s.CompanyDB == nil {
		return nil, fmt.Errorf("company database is not configured")
	}
	rows, errs, err := excelsvc.ParseAddressImport(path)
	if err != nil {
		return nil, err
	}
	result := &dto.AddressImportResult{
		TotalRows:  len(rows) + countUniqueErrorRows(errs),
		FailedRows: countUniqueErrorRows(errs),
		Errors:     errs,
	}
	if len(rows) == 0 {
		return result, nil
	}

	for _, row := range rows {
		var counts addressRowCounts
		err := s.CompanyDB.Transaction(func(tx *gorm.DB) error {
			country, created, err := upsertCountry(tx, row)
			if err != nil {
				return fmt.Errorf("CountryNameEn: %w", err)
			}
			if created {
				counts.countriesCreated++
			} else {
				counts.countriesUpdated++
			}

			division, created, err := upsertAddressDivision(tx, country.ID, row)
			if err != nil {
				return fmt.Errorf("DivisionNameEn: %w", err)
			}
			if created {
				counts.divisionsCreated++
			} else {
				counts.divisionsUpdated++
			}

			district, created, err := upsertAddressDistrict(tx, division.ID, row)
			if err != nil {
				return fmt.Errorf("DistrictNameEn: %w", err)
			}
			if created {
				counts.districtsCreated++
			} else {
				counts.districtsUpdated++
			}

			thana, created, err := upsertThana(tx, district.ID, row)
			if err != nil {
				return fmt.Errorf("ThanaNameEn: %w", err)
			}
			if created {
				counts.thanasCreated++
			} else {
				counts.thanasUpdated++
			}

			created, err = upsertPostOffice(tx, thana.ID, row)
			if err != nil {
				return fmt.Errorf("PostOfficeNameEn: %w", err)
			}
			if created {
				counts.postOfficesCreated++
			} else {
				counts.postOfficesUpdated++
			}

			return nil
		})
		if err != nil {
			column, message := splitAddressImportError(err)
			result.Errors = append(result.Errors, dto.RowError{Row: row.RowIndex, Column: column, Message: message})
			result.FailedRows++
			continue
		}

		result.CountriesCreated += counts.countriesCreated
		result.CountriesUpdated += counts.countriesUpdated
		result.DivisionsCreated += counts.divisionsCreated
		result.DivisionsUpdated += counts.divisionsUpdated
		result.DistrictsCreated += counts.districtsCreated
		result.DistrictsUpdated += counts.districtsUpdated
		result.ThanasCreated += counts.thanasCreated
		result.ThanasUpdated += counts.thanasUpdated
		result.PostOfficesCreated += counts.postOfficesCreated
		result.PostOfficesUpdated += counts.postOfficesUpdated
		result.SuccessRows++
	}

	if result.FailedRows > result.TotalRows {
		result.FailedRows = result.TotalRows
	}
	return result, nil
}

func (s *Service) BuildAddressDemoWorkbook() (*excelize.File, error) {
	return excelsvc.BuildAddressDemoWorkbook()
}

func upsertCountry(tx *gorm.DB, row excelsvc.AddressRow) (*models.Country, bool, error) {
	var country models.Country
	nameEn := addressName(row.CountryNameEn)
	err := tx.Select(countrySelect).Where("UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", nameEn).Order("NameEn, Id").Take(&country).Error
	if err == nil {
		country.NameEn = nameEn
		country.NameBn = addressFallback(row.CountryNameBn, nameEn)
		if strings.TrimSpace(country.Code) == "" {
			country.Code = inferCountryCode(nameEn)
		}
		country.IsActive = row.IsActive
		return &country, false, tx.Save(&country).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}
	country = models.Country{
		ID:       uuid.NewString(),
		NameEn:   nameEn,
		NameBn:   addressFallback(row.CountryNameBn, nameEn),
		Code:     inferCountryCode(nameEn),
		IsActive: row.IsActive,
	}
	return &country, true, tx.Create(&country).Error
}

func upsertAddressDivision(tx *gorm.DB, countryID string, row excelsvc.AddressRow) (*models.Division, bool, error) {
	var division models.Division
	nameEn := addressName(row.DivisionNameEn)
	err := tx.Select(divisionSelect).Where("CountryId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", countryID, nameEn).Order("NameEn, Id").Take(&division).Error
	if err == nil {
		division.CountryID = countryID
		division.NameEn = nameEn
		division.NameBn = addressFallback(row.DivisionNameBn, nameEn)
		division.IsActive = row.IsActive
		return &division, false, tx.Save(&division).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}
	division = models.Division{
		ID:        uuid.NewString(),
		CountryID: countryID,
		NameEn:    nameEn,
		NameBn:    addressFallback(row.DivisionNameBn, nameEn),
		IsActive:  row.IsActive,
	}
	return &division, true, tx.Create(&division).Error
}

func upsertAddressDistrict(tx *gorm.DB, divisionID string, row excelsvc.AddressRow) (*models.District, bool, error) {
	var district models.District
	nameEn := addressName(row.DistrictNameEn)
	err := tx.Select(districtSelect).Where("DivisionId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", divisionID, nameEn).Order("NameEn, Id").Take(&district).Error
	if err == nil {
		district.DivisionID = divisionID
		district.NameEn = nameEn
		district.NameBn = addressFallback(row.DistrictNameBn, nameEn)
		district.IsActive = row.IsActive
		return &district, false, tx.Save(&district).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}
	district = models.District{
		ID:         uuid.NewString(),
		DivisionID: divisionID,
		NameEn:     nameEn,
		NameBn:     addressFallback(row.DistrictNameBn, nameEn),
		IsActive:   row.IsActive,
	}
	return &district, true, tx.Create(&district).Error
}

func upsertThana(tx *gorm.DB, districtID string, row excelsvc.AddressRow) (*models.Upazila, bool, error) {
	var thana models.Upazila
	nameEn := addressName(row.ThanaNameEn)
	err := tx.Select(upazilaSelect).Where("DistrictId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?)", districtID, nameEn).Order("NameEn, Id").Take(&thana).Error
	if err == nil {
		thana.DistrictID = districtID
		thana.NameEn = nameEn
		thana.NameBn = addressFallback(row.ThanaNameBn, nameEn)
		thana.IsActive = row.IsActive
		return &thana, false, tx.Save(&thana).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}
	thana = models.Upazila{
		ID:         uuid.NewString(),
		DistrictID: districtID,
		NameEn:     nameEn,
		NameBn:     addressFallback(row.ThanaNameBn, nameEn),
		IsActive:   row.IsActive,
	}
	return &thana, true, tx.Create(&thana).Error
}

func upsertPostOffice(tx *gorm.DB, thanaID string, row excelsvc.AddressRow) (bool, error) {
	var postOffice models.PostOffice
	nameEn := addressName(row.PostOfficeNameEn)
	postCode := addressName(row.PostCode)
	err := tx.Select(postOfficeSelect).Where("UpazilaId = ? AND UPPER(LTRIM(RTRIM(NameEn))) = UPPER(?) AND LTRIM(RTRIM(PostalCode)) = ?", thanaID, nameEn, postCode).Order("NameEn, PostalCode, Id").Take(&postOffice).Error
	if err == nil {
		postOffice.UpazilaID = thanaID
		postOffice.NameEn = nameEn
		postOffice.NameBn = addressFallback(row.PostOfficeNameBn, nameEn)
		postOffice.PostalCode = postCode
		postOffice.IsActive = row.IsActive
		return false, tx.Save(&postOffice).Error
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return false, err
	}
	postOffice = models.PostOffice{
		ID:         uuid.NewString(),
		UpazilaID:  thanaID,
		NameEn:     nameEn,
		NameBn:     addressFallback(row.PostOfficeNameBn, nameEn),
		PostalCode: postCode,
		IsActive:   row.IsActive,
	}
	return true, tx.Create(&postOffice).Error
}

func addressName(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}

func addressFallback(value, fallback string) string {
	value = addressName(value)
	if value == "" {
		return addressName(fallback)
	}
	return value
}

func inferCountryCode(name string) string {
	normalized := strings.ToLower(addressName(name))
	if normalized == "bangladesh" {
		return "BD"
	}
	parts := strings.Fields(normalized)
	var b strings.Builder
	for _, part := range parts {
		if part != "" {
			b.WriteByte(strings.ToUpper(part[:1])[0])
		}
		if b.Len() == 2 {
			return b.String()
		}
	}
	compact := strings.ToUpper(strings.ReplaceAll(normalized, " ", ""))
	if len(compact) >= 2 {
		return compact[:2]
	}
	if compact == "" {
		return "NA"
	}
	return compact
}

func splitAddressImportError(err error) (string, string) {
	message := err.Error()
	parts := strings.SplitN(message, ": ", 2)
	if len(parts) == 2 {
		return parts[0], parts[1]
	}
	return "", message
}
