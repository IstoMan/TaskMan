package services

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"istoman.backend.task.com/models"
)

type projectRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type projectPatchRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

type projectResponse struct {
	ID                 string `json:"id"`
	Name               string `json:"name"`
	Description        string `json:"description"`
	TaskCount          int64  `json:"task_count"`
	CompletedTaskCount int64  `json:"completed_task_count"`
}

func mapProject(project models.Project, taskCount int64, completedTaskCount int64) projectResponse {
	return projectResponse{
		ID:                 project.ProjectID.String(),
		Name:               project.Name,
		Description:        project.Description,
		TaskCount:          taskCount,
		CompletedTaskCount: completedTaskCount,
	}
}

func getProjectTaskCounts(projectID uuid.UUID) (int64, int64, error) {
	var taskCount int64
	if err := models.DB.Model(&models.Task{}).Where("project_id = ?", projectID).Count(&taskCount).Error; err != nil {
		return 0, 0, err
	}

	var completedTaskCount int64
	if err := models.DB.Model(&models.Task{}).Where("project_id = ? AND progress IN ?", projectID, []models.Status{models.DONE, models.COMPLETED}).Count(&completedTaskCount).Error; err != nil {
		return 0, 0, err
	}

	return taskCount, completedTaskCount, nil
}

func ListProjects(c *gin.Context) {
	var projects []models.Project
	if err := models.DB.Order("created_at DESC").Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't fetch projects"})
		return
	}

	response := make([]projectResponse, 0, len(projects))
	for _, project := range projects {
		taskCount, completedTaskCount, err := getProjectTaskCounts(project.ProjectID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't compute project task counts"})
			return
		}
		response = append(response, mapProject(project, taskCount, completedTaskCount))
	}

	c.JSON(http.StatusOK, gin.H{"projects": response})
}

func CreateProject(c *gin.Context) {
	var payload projectRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project name cannot be empty"})
		return
	}

	project := models.Project{
		ProjectID:   uuid.New(),
		Name:        name,
		Description: strings.TrimSpace(payload.Description),
	}

	if err := models.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't create project"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"project": mapProject(project, 0, 0)})
}

func UpdateProject(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project id"})
		return
	}

	var payload projectPatchRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	updates := map[string]any{}
	if payload.Name != nil {
		name := strings.TrimSpace(*payload.Name)
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Project name cannot be empty"})
			return
		}
		updates["name"] = name
	}

	if payload.Description != nil {
		updates["description"] = strings.TrimSpace(*payload.Description)
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No project fields provided to update"})
		return
	}

	output := models.DB.Model(&models.Project{}).Where("project_id = ?", projectID).Updates(updates)
	if output.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't update project"})
		return
	}
	if output.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	var project models.Project
	if err := models.DB.Where("project_id = ?", projectID).First(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Project updated but failed to load response"})
		return
	}

	taskCount, completedTaskCount, err := getProjectTaskCounts(project.ProjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't compute project task count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"project": mapProject(project, taskCount, completedTaskCount)})
}

func RemoveProject(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project id"})
		return
	}

	if err := models.DB.Model(&models.Task{}).Where("project_id = ?", projectID).Update("project_id", nil).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't detach tasks from project"})
		return
	}

	output := models.DB.Where("project_id = ?", projectID).Delete(&models.Project{})
	if output.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Couldn't remove project"})
		return
	}
	if output.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.Status(http.StatusAccepted)
}
