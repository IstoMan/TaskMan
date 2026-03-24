package services

import (
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"istoman.backend.task.com/models"
)

func InitDB() {
	var err error
	models.DB, err = gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = models.DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	err = models.DB.AutoMigrate(&models.Project{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	err = models.DB.AutoMigrate(&models.Task{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
}
