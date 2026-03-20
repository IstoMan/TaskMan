package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Status string

const (
	PENDING   Status = "pending"
	COMPLETED Status = "completed"
)

func (s Status) Valid() bool {
	switch s {
	case PENDING, COMPLETED:
		return true
	}
	return false
}

type Task struct {
	gorm.Model
	TaskID         uuid.UUID `gorm:"primaryKey;uniqueIndex"`
	TaskTitle      string    `json:"task_title"`
	TaskDesc       string    `json:"task_desc"`
	UserID         uuid.UUID `json:"user_id"`
	AssignedMember User      `json:"assigned_member" gorm:"foreignKey:UserID;references:UserID"`
	Deadline       time.Time `json:"deadline"`
	Progress       Status    `json:"progress"`
}

type AssignRequest struct {
	UserID   uuid.UUID `json:"user_id"`
	Deadline string    `json:"deadline"`
}
