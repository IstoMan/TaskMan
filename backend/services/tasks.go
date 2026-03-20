package services

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"istoman.backend.task.com/models"
)

func CreateTask(c *gin.Context) {
	var newTask models.Task
	if err := c.ShouldBindJSON(&newTask); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if newTask.TaskTitle == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Task title cannot be empty"})
		return
	}

	newTask.TaskID = uuid.New()
	newTask.Progress = models.PENDING

	output := models.DB.Create(&newTask)
	if output.Error != nil {
		log.Printf("Couldn't add entry: error: %v", output.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't add entry"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"task_id": newTask.TaskID,
		"message": "Task Created Successfully",
	})
}

func RemoveTask(c *gin.Context) {
	taskID := c.Param("id")
	TaskID, err := uuid.Parse(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Couldn't Prase taskID"})
		return
	}

	output := models.DB.Where("task_id = ?", TaskID).Delete(&models.Task{})
	if output.Error != nil {
		log.Printf("Couldn't delete task, error: %v\n", output.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't Delete task"})
		return
	}

	c.Status(http.StatusAccepted)
}

func AssignTask(c *gin.Context) {
	taskID := c.Param("id")
	TaskID, err := uuid.Parse(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var assignReq models.AssignRequest
	if err := c.ShouldBindJSON(&assignReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Couldn't parse the JSON"})
		return
	}

	fmt.Println("Tring to assign Task")

	var neededUser models.User
	result := models.DB.Where("user_id = ?", assignReq.UserID).First(&neededUser)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Couldn't Find user"})
		return
	}

	layout := "02/01/2006 03:04 PM"
	newDeadline, err := time.Parse(layout, assignReq.Deadline)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wrong format for time: dd/mm/yyyy mm:HH AM"})
		return
	}

	var newTask models.Task
	output := models.DB.Where("task_id = ?", TaskID).Model(&newTask).Updates(map[string]any{
		"user_id":  neededUser.UserID,
		"deadline": newDeadline,
	})
	if output.Error != nil {
		log.Printf("Couldn't update the struct error: %v", output.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": output.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"task_id":  TaskID,
		"user_id":  neededUser.UserID,
		"deadline": newDeadline,
		"message":  "Task Assigned Successfully",
	})
}
