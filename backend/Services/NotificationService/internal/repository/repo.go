package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"notificationservice/internal/models"
)

type NotificationRepository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Create(n *models.Notification) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	if n.Type == "" {
		n.Type = models.TypeInApp
	}
	now := time.Now()
	n.Status = models.StatusSent
	n.SentAt = &now
	n.CreatedAt = now
	return r.db.Create(n).Error
}

func (r *NotificationRepository) ListByRecipient(recipientId uuid.UUID) ([]models.Notification, error) {
	var list []models.Notification
	err := r.db.Where("RecipientId = ? AND IsDeleted = 0", recipientId).
		Order("CreatedAt DESC").
		Find(&list).Error
	return list, err
}

func (r *NotificationRepository) MarkRead(id uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&models.Notification{}).
		Where("Id = ? AND IsDeleted = 0", id).
		Updates(map[string]any{"Status": models.StatusRead, "UpdatedAt": now}).Error
}

func (r *NotificationRepository) SoftDelete(id uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&models.Notification{}).
		Where("Id = ?", id).
		Updates(map[string]any{"IsDeleted": true, "DeletedAt": now}).Error
}

func (r *NotificationRepository) UnreadCount(recipientId uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Notification{}).
		Where("RecipientId = ? AND Status <> ? AND IsDeleted = 0", recipientId, models.StatusRead).
		Count(&count).Error
	return count, err
}

type TemplateRepository struct {
	db *gorm.DB
}

func NewTemplates(db *gorm.DB) *TemplateRepository {
	return &TemplateRepository{db: db}
}

func (r *TemplateRepository) List() ([]models.NotificationTemplate, error) {
	var list []models.NotificationTemplate
	err := r.db.Where("IsDeleted = 0").Order("CreatedAt DESC").Find(&list).Error
	return list, err
}

func (r *TemplateRepository) GetByID(id uuid.UUID) (*models.NotificationTemplate, error) {
	var t models.NotificationTemplate
	err := r.db.Where("Id = ? AND IsDeleted = 0", id).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TemplateRepository) Create(t *models.NotificationTemplate) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	t.CreatedAt = time.Now()
	return r.db.Create(t).Error
}
