package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Status string

const (
	TODO       Status = "todo"
	INPROGRESS Status = "in-progress"
	DONE       Status = "done"
	PENDING    Status = "pending"
	COMPLETED  Status = "completed"
)

func (s Status) Valid() bool {
	switch s {
	case TODO, INPROGRESS, DONE, PENDING, COMPLETED:
		return true
	}
	return false
}

type Task struct {
	gorm.Model
	TaskID         uuid.UUID  `gorm:"primaryKey;uniqueIndex"`
	TaskTitle      string     `json:"task_title"`
	TaskDesc       string     `json:"task_desc"`
	ProjectID      *uuid.UUID `json:"project_id"`
	Project        *Project   `json:"project" gorm:"foreignKey:ProjectID;references:ProjectID"`
	UserID         *uuid.UUID `json:"user_id"`
	AssignedMember *User      `json:"assigned_member" gorm:"foreignKey:UserID;references:UserID"`
	Deadline       *time.Time `json:"deadline"`
	Progress       Status     `json:"progress"`
}

type AssignRequest struct {
	UserID   uuid.UUID `json:"user_id"`
	Deadline string    `json:"deadline"`
}
