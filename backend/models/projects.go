package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Project struct {
	gorm.Model
	ProjectID   uuid.UUID `gorm:"primaryKey;uniqueIndex"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
}
