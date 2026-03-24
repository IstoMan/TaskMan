// Package models: Defines all the data required
package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	ADMIN  UserRole = "admin"
	MEMBER UserRole = "member"
)

type User struct {
	gorm.Model
	UserID      uuid.UUID `gorm:"primaryKey;uniqueIndex"`
	Name        string    `json:"name"`
	Email       string    `json:"email" gorm:"unique"`
	Role        UserRole  `json:"role"`
	MemberTitle string    `json:"member_title"`
	Password    string    `json:"password"`
}

func (s UserRole) Valid() bool {
	switch s {
	case ADMIN, MEMBER:
		return true
	}
	return false
}
