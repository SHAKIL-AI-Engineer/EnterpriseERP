package companylookup

import (
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Letterhead holds company branding lines for report exports.
type Letterhead struct {
	CompanyName    string
	CompanyAddress string
}

type companyRow struct {
	CompanyNameEn string  `gorm:"column:CompanyNameEn"`
	CompanyNameBn *string `gorm:"column:CompanyNameBn"`
	AddressEn     *string `gorm:"column:AddressEn"`
	AddressBn     *string `gorm:"column:AddressBn"`
}

// Resolve loads company name and address from CompanyServiceDB by company GUID.
// On missing row or DB error, returns empty strings so export can still complete.
func Resolve(db *gorm.DB, companyID uuid.UUID) (Letterhead, error) {
	if db == nil || companyID == uuid.Nil {
		return Letterhead{}, nil
	}

	var row companyRow
	err := db.Table("Companies").
		Select("CompanyNameEn, CompanyNameBn, AddressEn, AddressBn").
		Where("Id = ?", companyID).
		Take(&row).Error
	if err != nil {
		return Letterhead{}, nil
	}

	return Letterhead{
		CompanyName:    pickName(row.CompanyNameEn, row.CompanyNameBn),
		CompanyAddress: pickAddress(row.AddressEn, row.AddressBn),
	}, nil
}

func pickName(en string, bn *string) string {
	if s := strings.TrimSpace(en); s != "" {
		return s
	}
	if bn != nil {
		if s := strings.TrimSpace(*bn); s != "" {
			return s
		}
	}
	return ""
}

func pickAddress(en, bn *string) string {
	if en != nil {
		if s := strings.TrimSpace(*en); s != "" {
			return s
		}
	}
	if bn != nil {
		if s := strings.TrimSpace(*bn); s != "" {
			return s
		}
	}
	return ""
}
