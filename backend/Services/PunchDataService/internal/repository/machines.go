package repository

import (
	"context"
	"time"

	"github.com/enterprise-erp/punchdata/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// PunchMachineFilter describes the optional machine list filters.
type PunchMachineFilter struct {
	CompanyID *int
	Status    string
	IsActive  *bool
	Page      int
	PageSize  int
}

func (r *Repository) UpsertPunchMachine(ctx context.Context, machine *models.PunchMachine) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "CompanyId"}, {Name: "DeviceCode"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"DeviceName",
			"MachineNo",
			"IpAddress",
			"Port",
			"UseTcp",
			"ProductName",
			"SerialNumber",
			"Password",
			"IsActive",
			"UpdatedAt",
		}),
	}).Create(machine).Error
}

func (r *Repository) GetPunchMachine(ctx context.Context, id uuid.UUID) (*models.PunchMachine, error) {
	var machine models.PunchMachine
	if err := r.db.WithContext(ctx).First(&machine, "Id = ?", id).Error; err != nil {
		return nil, err
	}
	return &machine, nil
}

func (r *Repository) GetPunchMachineByCompanyMachineNo(ctx context.Context, companyID, machineNo int) (*models.PunchMachine, error) {
	var machine models.PunchMachine
	if err := r.db.WithContext(ctx).
		First(&machine, "CompanyId = ? AND MachineNo = ?", companyID, machineNo).Error; err != nil {
		return nil, err
	}
	return &machine, nil
}

func (r *Repository) GetPunchMachineByCompanyDeviceCode(ctx context.Context, companyID int, deviceCode string) (*models.PunchMachine, error) {
	var machine models.PunchMachine
	if err := r.db.WithContext(ctx).
		First(&machine, "CompanyId = ? AND DeviceCode = ?", companyID, deviceCode).Error; err != nil {
		return nil, err
	}
	return &machine, nil
}

func (r *Repository) ListActivePunchMachines(ctx context.Context, companyID int) ([]models.PunchMachine, error) {
	var items []models.PunchMachine
	err := r.db.WithContext(ctx).
		Where("CompanyId = ? AND IsActive = ?", companyID, true).
		Order("MachineNo ASC").
		Find(&items).Error
	return items, err
}

func (r *Repository) ListPunchMachines(ctx context.Context, f PunchMachineFilter) ([]models.PunchMachine, int64, error) {
	applyFilters := func(q *gorm.DB) *gorm.DB {
		q = q.Model(&models.PunchMachine{})
		if f.CompanyID != nil && *f.CompanyID > 0 {
			q = q.Where("CompanyId = ?", *f.CompanyID)
		}
		if f.Status != "" {
			q = q.Where("LastConnectionStatus = ?", f.Status)
		}
		if f.IsActive != nil {
			q = q.Where("IsActive = ?", *f.IsActive)
		}
		return q
	}

	var total int64
	if err := applyFilters(r.db.WithContext(ctx)).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := f.Page
	if page < 1 {
		page = 1
	}
	size := f.PageSize
	if size < 1 || size > 200 {
		size = 50
	}

	var items []models.PunchMachine
	err := applyFilters(r.db.WithContext(ctx)).
		Order("MachineNo ASC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&items).Error
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *Repository) UpdatePunchMachineConnection(ctx context.Context, id uuid.UUID, status string, connectedAt *time.Time, message *string) error {
	return r.db.WithContext(ctx).Model(&models.PunchMachine{}).
		Where("Id = ?", id).
		Updates(map[string]any{
			"LastConnectionStatus": status,
			"LastConnectedAt":      connectedAt,
			"LastError":            message,
			"UpdatedAt":            time.Now().UTC(),
		}).Error
}

func (r *Repository) UpdatePunchMachineSync(ctx context.Context, id uuid.UUID, syncedAt time.Time, recordCount int, message *string) error {
	return r.db.WithContext(ctx).Model(&models.PunchMachine{}).
		Where("Id = ?", id).
		Updates(map[string]any{
			"LastConnectionStatus": models.MachineStatusConnected,
			"LastConnectedAt":      syncedAt,
			"LastSyncedAt":         syncedAt,
			"LastSyncRecordCount":  recordCount,
			"LastError":            message,
			"UpdatedAt":            time.Now().UTC(),
		}).Error
}
